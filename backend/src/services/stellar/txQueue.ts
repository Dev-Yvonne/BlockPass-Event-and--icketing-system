/** Runs tasks one at a time, so transactions from one source account don't race. */
function createTxQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = tail.then(task, task);
    tail = run.catch(() => undefined);
    return run;
  };
}

/**
 * Every mint uses the distributor as its transaction source, so two concurrent
 * submissions would race for the same sequence number. Running them one at a
 * time removes that race within a process; ticketAssets.ts retries tx_bad_seq
 * to cover separate processes.
 */
export const enqueueDistributorTx = createTxQueue();

/** Gate redemptions use the vault as source, so check-ins never wait behind ticket sales. */
export const enqueueVaultTx = createTxQueue();
