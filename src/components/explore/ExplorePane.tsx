import { Outlet } from "solid-navigator";
import { Show } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { styled } from "solid-styled-components";

const ExplorePaneContainer = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 900px;
  align-self: center;
`;

export default function ExplorePane() {
  const {account} = useStore();
  const user = () => account.user();

  return (
    <Show when={user()}>
      <ExplorePaneContainer>
        <Outlet name="explorePane"/>
      </ExplorePaneContainer>
    </Show>
  );
}