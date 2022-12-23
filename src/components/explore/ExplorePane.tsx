import exploreRoutes from '@/common/exploreRoutes';
import { Route, Routes } from '@nerimity/solid-router';
import { For, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import { styled } from 'solid-styled-components';

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
        <For each={exploreRoutes}>
          {routes => (
            <Routes>
              {routes.path && <Route path={`/${routes.path}`} component={routes.element} />}
            </Routes>
          )}
        </For>
      </ExplorePaneContainer>
    </Show>
  );
}