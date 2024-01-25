import { ContextStore } from "./store";

const createDispatcher = <T extends Record<string, any>>(actions: T, state: ContextStore) => {

  return <H extends keyof T>(name: H, payload: Parameters<T[H]>[0]) => {
    const action = actions[name];
    if (!action) {
      throw new Error(`Unknown action: ${name as string}`);
    }
    console.warn("Dispatched:\nName:", name, "\nPayload:", payload);
    return action(payload, state) as ReturnType<T[H]>;
  }
  
}

export {
  createDispatcher
}