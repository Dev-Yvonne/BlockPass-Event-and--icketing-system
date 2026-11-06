import { Keypair } from "@stellar/stellar-sdk";
import AttendeeWallet from "../../models/AttendeeWallet";
import Event, { IEvent } from "../../models/Event";
import { AppError } from "../../utils/AppError";
import { decryptSecret, encryptSecret } from "../../utils/walletCrypto";
import { ensureAttendeeAccount, ensureFunded } from "./accounts";
import { deriveEventCode } from "./ticketAssets";
import { generateCustodialWallet } from "./wallet";

/**
 * Gives an event its own issuer account the first time it is needed. The
 * conditional update means concurrent callers settle on a single issuer.
 */
export async function ensureEventIssuer(event: IEvent): Promise<Keypair> {
  if (!event.ticketing?.issuerPublicKey) {
    const generated = Keypair.random();
    await Event.updateOne(
      { _id: event._id, "ticketing.issuerPublicKey": { $exists: false } },
      {
        $set: {
          "ticketing.eventCode": deriveEventCode(event.title),
          "ticketing.issuerPublicKey": generated.publicKey(),
          "ticketing.issuerSecretEncrypted": encryptSecret(generated.secret()),
        },
      }
    );
  }

  const stored = await Event.findById(event._id).select("+ticketing.issuerSecretEncrypted");
  const encrypted = stored?.ticketing?.issuerSecretEncrypted;
  if (!encrypted) throw new AppError("Event issuer could not be provisioned", 500);

  const issuer = Keypair.fromSecret(decryptSecret(encrypted));
  await ensureFunded(issuer.publicKey(), { allowDistributorFallback: true });
  return issuer;
}

/** Returns the attendee's custodial wallet, creating and funding it if new. */
export async function ensureAttendeeWallet(email: string): Promise<Keypair> {
  const generated = generateCustodialWallet();
  await AttendeeWallet.updateOne(
    { email },
    { $setOnInsert: { email, ...generated } },
    { upsert: true }
  ).catch((err) => {
    // Two first-time orders from one email can race on the unique index.
    if ((err as { code?: number }).code !== 11000) throw err;
  });

  const wallet = await AttendeeWallet.findOne({ email }).select("+encryptedSecret");
  if (!wallet) throw new AppError("Attendee wallet could not be provisioned", 500);

  const keypair = Keypair.fromSecret(decryptSecret(wallet.encryptedSecret));
  await ensureAttendeeAccount(keypair.publicKey());
  return keypair;
}
