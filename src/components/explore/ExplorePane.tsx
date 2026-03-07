import { Outlet } from "solid-navigator";
import { Show } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { css, styled } from "solid-styled-components";

import { t } from "@nerimity/i18lite";
import Input from "../ui/input/Input";
import DropDown, { DropDownItem } from "../ui/drop-down/DropDown";

const ExplorePaneContainer = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 1530px;
  align-self: center;
`;

export default function ExplorePane() {
  const { account } = useStore();
  const user = () => account.user();

  return (
    <Show when={user()}>
      <ExplorePaneContainer>
        <Outlet name="explorePane" />
      </ExplorePaneContainer>
    </Show>
  );
}

export const ExplorePageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export const SearchHeader = styled("div")`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  flex: 1;
  gap: 10px;
  margin-bottom: 10px;
`;

interface Query {
  sort: string;
  filter: string;
  search: string;
}

export function ExploreSearch(props: {
  sortOpts: DropDownItem[];
  filterOpts: DropDownItem[];
  query: () => Query;
  setQuery: (q: Query) => void;
}) {
  return (
    <SearchHeader>
      <Input
        label={t("general.searchPlaceholder")}
        value={props.query().search}
        onText={(text) => props.setQuery({ ...props.query(), search: text })}
        class={css`
          flex: 1;
          min-width: 200px;
          span {
            margin-bottom: 2px;
          }
        `}
      />
      <DropDown
        title={t("explore.sort")}
        items={props.sortOpts}
        selectedId={props.query().sort}
        onChange={(i) => props.setQuery({ ...props.query(), sort: i.id })}
        class={css`
          min-width: 11em;
        `}
      />
      <DropDown
        title={t("explore.filter")}
        items={props.filterOpts}
        selectedId={props.query().filter}
        onChange={(i) => props.setQuery({ ...props.query(), filter: i.id })}
        class={css`
          min-width: 6em;
        `}
      />
    </SearchHeader>
  );
}
