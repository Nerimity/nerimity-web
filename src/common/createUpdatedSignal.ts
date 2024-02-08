import { createEffect } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

export type CreatedUpdateSignal<T> = [() => T, () => Partial<T>, <K extends keyof T>(key: keyof T, value: T[K]) => void];

export function createUpdatedSignal<T>(defaultValues: () => T): CreatedUpdateSignal<T> { // defaultValues will be an object

  const [values, setValues] = createStore<T>({...defaultValues()} as any);


  createEffect(() => {
    setValues(reconcile({...defaultValues()}));
  });

  
  // params of key and value
  const updateValue = <K extends keyof T>(key: keyof T, value: T[K]) => {
    setValues(key as any, value as any);
  };

  const updatedValues = () => {
    const updatedValues: Partial<T> = {};
    for (const key in values) {
      const defaultValue = defaultValues()[key];
      const updatedValue = values[key];
      if (defaultValue !== updatedValue) {
        updatedValues[key] = updatedValue;
      }
    }
    return updatedValues;
  };
  return [() => values, updatedValues, updateValue];
}