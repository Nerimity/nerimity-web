import { A } from "solid-navigator";
import { createMemo, createSignal, Show } from "solid-js";
import { css, styled } from "solid-styled-components";
import Avatar from "../ui/Avatar";
import Text from "../ui/Text";
import { FlexRow } from "../ui/Flexbox";
import Checkbox from "../ui/Checkbox";
import { CustomLink } from "../ui/CustomLink";
import RouterEndpoints from "@/common/RouterEndpoints";
import { formatTimestamp } from "@/common/date";
import { classNames } from "@/common/classNames";
import { selectedUsers, setSelectedUsers } from "./selectedUsers";

const PaneContainer = styled("div")<{ expanded: boolean }>`
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  overflow: hidden;

  ${(props) =>
    props.expanded
      ? "resize: vertical; height: 500px;"
      : "  max-height: 500px;"}

  flex-shrink: 0;
  margin: 5px;
  margin-left: 10px;
  margin-right: 10px;
  min-height: 80px;
`;

export const UserPaneContainer = styled(PaneContainer)``;

const itemStyles = css`
  display: flex;
  flex-shrink: 0;
  gap: 5px;
  padding: 5px;
  padding-left: 16px;
  cursor: pointer;
  transition: 0.2s;
  text-decoration: none;
  color: white;

  border-top: solid 1px rgba(0, 0, 0, 0.4);
  padding-top: 10px;
  padding-bottom: 10px;

  .checkbox {
    margin-right: 10px;
  }

  &:hover {
    background-color: rgb(66, 66, 66);
  }
`;

const ItemDetailContainer = styled("div")`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: 6px;
`;

const isUserSelected = (id: string) => selectedUsers().find((u) => u.id === id);

export function User(props: { user: any; class?: string }) {
  const joined = formatTimestamp(props.user.joinedAt);
  const [hovered, setHovered] = createSignal(false);

  const selected = createMemo(() => isUserSelected(props.user.id));

  const onCheckChanged = () => {
    if (selected()) {
      setSelectedUsers(selectedUsers().filter((u) => u.id !== props.user.id));
      return;
    }
    setSelectedUsers([...selectedUsers(), props.user]);
  };

  const onLinkClick = (event: any) => {
    if (event.target.closest(".checkbox")) event.preventDefault();
  };

  return (
    <A
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      href={`/app/moderation/users/${props.user.id}`}
      onclick={onLinkClick}
      class={classNames(itemStyles, props.class)}
    >
      <Checkbox checked={selected()} onChange={onCheckChanged} />
      <CustomLink href={RouterEndpoints.PROFILE(props.user.id)}>
        <Avatar
          animate={hovered()}
          user={props.user}
          size={28}
          class={css`
            margin-top: 2px;
          `}
        />
      </CustomLink>
      <ItemDetailContainer class="details">
        <FlexRow>
          <Text size={14}>{props.user.username}</Text>
          <Text size={14} opacity={0.6}>
            :{props.user.tag}
          </Text>
        </FlexRow>
        <FlexRow gap={3} itemsCenter>
          <Text size={12} opacity={0.6}>
            Registered:
          </Text>
          <Text size={12}>{joined}</Text>
          <Show when={props.user.suspension}>
            <Text
              size={12}
              style={{
                background: "var(--alert-color)",
                "border-radius": "4px",
                padding: "3px",
              }}
            >
              Banned
            </Text>
          </Show>
          <Show when={props.user.shadowBan}>
            <Text
              size={12}
              style={{
                background: "var(--warn-color)",
                "border-radius": "4px",
                padding: "3px",
              }}
            >
              Shadow Banned
            </Text>
          </Show>
          <Show when={props.user.bot}>
            <Text
              size={12}
              style={{
                background: "var(--primary-color)",
                "border-radius": "4px",
                padding: "3px",
              }}
            >
              Bot
            </Text>
          </Show>
        </FlexRow>
      </ItemDetailContainer>
    </A>
  );
}
