import MintLog, { IMintLog } from "../models/MintLog";

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  return `${name.charAt(0)}***@${domain}`;
}

type MintLogEntry = Pick<IMintLog, "stage" | "reference"> &
  Partial<Omit<IMintLog, "stage" | "reference" | "createdAt">>;

/**
 * Records a checkout stage to stdout and the database. A logging failure must
 * never fail an order that has already been minted, so it's only reported.
 */
export async function logMint(entry: MintLogEntry): Promise<void> {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...entry }));
  try {
    await MintLog.create(entry);
  } catch (err) {
    console.error("Could not persist mint log:", err);
  }
}
