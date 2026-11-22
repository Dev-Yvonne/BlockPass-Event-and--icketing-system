import ScanLog, { IScanLog } from "../models/ScanLog";

type ScanLogEntry = Pick<IScanLog, "stage"> & Partial<Omit<IScanLog, "stage" | "createdAt">>;

/** Same contract as the mint log: stdout for platform logs, the database for the UI. */
export async function logScan(entry: ScanLogEntry): Promise<void> {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...entry }));
  try {
    await ScanLog.create(entry);
  } catch (err) {
    console.error("Could not persist scan log:", err);
  }
}
