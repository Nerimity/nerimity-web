import style from "./UserPage.module.scss";
import { RawUser } from "@/chat-api/RawData";
import {
  getUsers,
  ModerationUser,
} from "@/chat-api/services/ModerationService";
import { fullDateTime } from "@/common/date";
import { usePromise } from "@/common/usePromise";
import Avatar from "@/components/ui/Avatar";
import { Table } from "@/components/ui/table/Table";
import { t } from "i18next";
import { For } from "solid-js";

const NameField = (props: { user: RawUser }) => {
  return (
    <div class={style.nameField}>
      <Avatar user={props.user} size={28} />
      {props.user.username}:{props.user.tag}
    </div>
  );
};

const Tag = (props: { tag: string; color: string }) => (
  <span class={style.tag} style={{ "--color": props.color }}>
    {props.tag}
  </span>
);

const TagsField = (props: { user: ModerationUser }) => {
  const isBot = props.user.bot;
  const isSuspended = props.user.suspension;
  const shadowBanned = props.user.shadowBan;

  if (!isBot && !isSuspended && !shadowBanned) return null;

  return (
    <div class={style.tagsField}>
      {isBot ? <Tag tag={t("profile.moderatorsOnly.usersPage.bot")} color="var(--primary-color)" /> : ""}
      {isSuspended ? <Tag tag={t("profile.moderatorsOnly.usersPage.suspended")} color="var(--alert-color)" /> : ""}
      {shadowBanned ? (
        <Tag tag={t("profile.moderatorsOnly.usersPage.shadowBanned")} color="var(--alert-color)" />
      ) : (
        ""
      )}
    </div>
  );
};

export default function UsersPage() {
  const users = usePromise(() => getUsers(50));

  // const itemsForTable = () => {
  //   return users.data()?.map((user) => (
  //     [<NameField user={user} />, fullDateTime(user.joinedAt), <TagsField user={user}/>]
  //   )) || [];
  // };

  return (
    <div>
      <h1>{t("profile.moderatorsOnly.usersPage.title")}</h1>
      <Table.Root headers={[t("profile.moderatorsOnly.usersPage.name"), t("profile.moderatorsOnly.usersPage.joined"), t("profile.moderatorsOnly.usersPage.tags")]}>
        <For each={users.data() || []}>
          {(user) => (
            <Table.Item href={`./${user.id}`}>
              <Table.Field><NameField user={user} /></Table.Field>
              <Table.Field mobileTitle={t("profile.moderatorsOnly.usersPage.joined")}><div>{fullDateTime(user.joinedAt)}</div></Table.Field>
              <Table.Field><TagsField user={user} /></Table.Field>
            </Table.Item>
          )}
        </For>
      </Table.Root>
    </div>
  );
}
