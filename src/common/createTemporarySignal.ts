import { createEffect, createSignal, on } from "solid-js";

export function createTemporarySignal<T>(v: () => T) {
  const [value, setValue] = createSignal(v());
  createEffect(on(v, () => setValue(v)));

  const resetValue = () => setValue(v);

  return [value, setValue, resetValue] as const;
}
