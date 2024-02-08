import { Suspense } from "solid-js";

export default function CustomSuspense (props: {children: any, fallback?: any}) {
  return <Suspense fallback={props.fallback || <div>Loading...</div>} {...props}/>;
}