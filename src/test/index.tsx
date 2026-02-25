import { Route } from "solid-navigator";
import Timestamps from "./Timestamps";

export default function TestRoutes() {
  return (
    <Route
      path="/timestamps"
      component={Timestamps}
    />
  )
}
