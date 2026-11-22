"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiEnvelope } from "./api";

/** Loads data on mount / when deps change. `reload()` refetches. */
export function useApi<T>(loader: () => Promise<ApiEnvelope<T>>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<ApiEnvelope<T>["meta"]>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  // When the inputs change, show the loading state again (adjusting state during render, per React docs).
  const key = JSON.stringify(deps);
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) {
    setPrevKey(key);
    setLoading(true);
  }

  const fetchNow = useCallback(
    () =>
      loader()
        .then((res) => {
          setData(res.data);
          setMeta(res.meta);
          setError(null);
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Something went wrong"))
        .finally(() => setLoading(false)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  useEffect(() => {
    void fetchNow();
  }, [fetchNow]);

  const reload = useCallback(async () => {
    setLoading(true);
    await loaderRef
      .current()
      .then((res) => {
        setData(res.data);
        setMeta(res.meta);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Something went wrong"))
      .finally(() => setLoading(false));
  }, []);

  return { data, meta, error, loading, reload, setData };
}

/** Runs an action, tracks busy state and returns an error message instead of throwing. */
export function useAction() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async <R,>(key: string, fn: () => Promise<R>): Promise<R | undefined> => {
    setBusy(key);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return undefined;
    } finally {
      setBusy(null);
    }
  }, []);
  return { busy, error, setError, run };
}

/** Copies server data into an editable form whenever new data arrives (no effect needed). */
export function useFormFrom<S, T>(source: S | null, toForm: (s: S) => T, empty: T) {
  const [form, setForm] = useState<T>(empty);
  const [seen, setSeen] = useState<S | null>(null);
  if (source && source !== seen) {
    setSeen(source);
    setForm(toForm(source));
  }
  return [form, setForm] as const;
}

/** Current time captured once per mount – keeps render pure. */
export function useNow() {
  const [now] = useState(() => Date.now());
  return now;
}
