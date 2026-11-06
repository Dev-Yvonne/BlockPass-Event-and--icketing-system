"use client";

import { useCallback, useEffect, useState } from "react";

/** Loads data on mount and exposes a reload for after a change. */
export function useResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    setError("");
    return load()
      .then(setData)
      .catch((err: Error) => setError(err.message));
    // Callers pass a stable api function, so this runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, reload };
}
