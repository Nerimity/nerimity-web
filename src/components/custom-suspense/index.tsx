import { Suspense } from "solid-js";

export default function CustomSuspense (props: {children: any, fallback?: any}) {
  // TODO: Temporary removed lazy because of this bug: https://github.com/solidjs/solid/issues/1178
  return props.children
  // return <Suspense fallback={props.fallback || <div>Loading...</div>} {...props}/>
}