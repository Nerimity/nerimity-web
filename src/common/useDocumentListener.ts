import { onCleanup, onMount } from "solid-js"

export const useDocumentListener = <K extends keyof DocumentEventMap>(type: K, listener: (ev: DocumentEventMap[K]) => any) => {
  onMount(() => {
    document.addEventListener(type, listener)
    onCleanup(() => {
      document.removeEventListener(type, listener)
    })
  })
}
