let tail: Promise<unknown> = Promise.resolve();

/**
 * Every mint uses the distributor as its transaction source, so two concurrent
 * submissions would race for the same sequence number. Running them one at a
 * time removes that race within a process; ticketAssets.ts retries tx_bad_seq
 * to cover separate processes.
 */
export function enqueueDistributorTx<T>(task: () => Promise<T>): Promise<T> {
  const run = tail.then(task, task);
  tail = run.catch(() => undefined);
  return run;
}
