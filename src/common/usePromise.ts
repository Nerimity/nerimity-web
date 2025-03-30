import { createEffect, createSignal } from "solid-js";

export function usePromise<T>(func: () => Promise<T>) {
  const [data, setData] = createSignal<T | null>(null);
  const [error, setError] = createSignal<Error | null>(null);
  const [loading, setLoading] = createSignal<boolean>(false);

  createEffect(() => {
    setLoading(true);
    func().then(setData).catch(setError).finally(() => setLoading(false));
  });

  return { data, error, loading };
}