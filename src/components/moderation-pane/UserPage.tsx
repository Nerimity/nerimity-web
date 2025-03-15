import {
  Bitwise,
  USER_BADGES,
  addBit,
  hasBit,
  removeBit,
} from "@/chat-api/Bitwise";
import {
  ModerationUser,
  getUser,
  getUsersWithSameIPAddress,
  updateUser,
} from "@/chat-api/services/ModerationService";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import { useWindowProperties } from "@/common/useWindowProperties";
import { A, useParams } from "solid-navigator";
import { For, Show, createEffect, createSignal, on, onMount } from "solid-js";
import { css, styled } from "solid-styled-components";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import { Banner } from "../ui/Banner";
import Avatar from "../ui/Avatar";
import RouterEndpoints from "@/common/RouterEndpoints";
import { bannerUrl } from "@/chat-api/store/useUsers";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import Input from "../ui/input/Input";
import Checkbox from "../ui/Checkbox";
import { formatTimestamp } from "@/common/date";
import UnsuspendUsersModal from "./UnsuspendUsersModal";
import SuspendUsersModal from "./SuspendUsersModal";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import Button from "../ui/Button";
import env from "@/common/env";
import Text from "../ui/Text";
import { RawServer, RawUser } from "@/chat-api/RawData";
import { AuditLogPane, Server, User } from "./ModerationPane";
import EditUserSuspensionModal from "./EditUserSuspensionModal";
import WarnUserModal from "./WarnUserModal";
import { UserDetails } from "@/chat-api/services/UserService";
import ShadowBanUserModal from "./ShadowBanUserModal";
import UndoShadowBanUserModal from "./UndoShadowBanUserModal";

const UserPageContainer = styled(FlexColumn)`
  height: 100%;
  width: 100%;
  max-width: 900px;
  align-self: center;
  margin-top: 10px;
`;
const UserPageInnerContainer = styled(FlexColumn)`
  margin: 10px;
`;
const UserBannerContainer = styled(FlexRow)`
  display: flex;
  align-items: center;
  margin-left: 30px;
  height: 100%;
  z-index: 11111;
`;
const UserBannerDetails = styled(FlexColumn)`
  margin-left: 20px;
  margin-right: 20px;
  gap: 4px;
  font-size: 18px;
  z-index: 1111;
  background: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(34px);
  padding: 10px;
  border-radius: 8px;
`;

const BadgeItemStyles = css`
  && {
    margin: 0;
    &:not(:last-child) {
      border-radius: 0;
    }
    &:last-child {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }
  }
`;

const ChangePasswordButton = styled("button")`
  color: var(--primary-color);
  background-color: transparent;
  border: none;
  align-self: flex-start;
  cursor: pointer;
  user-select: none;
  &:hover {
    text-decoration: underline;
  }
`;

export default function UserPage() {
  const params = useParams<{ userId: string }>();
  const { width } = useWindowProperties();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const [showChangePassword, setShowChangePassword] = createSignal(false);

  const [user, setUser] = createSignal<ModerationUser | null>(null);

  const defaultInput = () => ({
    email: user()?.account?.email || "",
    username: user()?.username || "",
    tag: user()?.tag || "",
    badges: user()?.badges || 0,
    emailConfirmed: user()?.account?.emailConfirmed || false,
    newPassword: "",
    password: "",
  });

  const [inputValues, updatedInputValues, setInputValue] =
    createUpdatedSignal(defaultInput);

  createEffect(
    on(
      () => params.userId,
      () => {
        getUser(params.userId).then(setUser);
      }
    )
  );

  const requestStatus = () => (requestSent() ? "Saving..." : "Save Changes");
  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateUser(params.userId, values)
      .then(() => {
        getUser(params.userId).then(setUser);
        setInputValue("password", "");
      })
      .catch((err) => {
        setInputValue("password", "");
        setError(err.message);
      })
      .finally(() => setRequestSent(false));
  };

  const onBadgeUpdate = (checked: boolean, bit: number) => {
    if (checked) {
      setInputValue("badges", addBit(inputValues().badges, bit));
      return;
    }
    setInputValue("badges", removeBit(inputValues().badges, bit));
  };

  const onChangePasswordClick = () => {
    setInputValue("newPassword", "");
    setShowChangePassword(!showChangePassword());
  };

  const botApplicationUser = () => user()?.application?.creatorAccount?.user;

  return (
    <Show when={user()} keyed>
      <UserPageContainer>
        <UserPageInnerContainer>
          <Banner
            class={css`
              margin-bottom: 15px;
            `}
            margin={0}
            maxHeight={250}
            animate
            url={bannerUrl(user()!)}
            hexColor={user()!.hexColor}
          >
            <UserBannerContainer>
              {user() && (
                <Avatar
                  animate
                  user={user()!}
                  size={width() <= 1100 ? 70 : 100}
                />
              )}
              <UserBannerDetails>
                <div>{user()!.username}</div>
                <A
                  class={css`
                    font-size: 14px;
                  `}
                  href={RouterEndpoints.PROFILE(user()!.id)}
                >
                  Visit Profile
                </A>
              </UserBannerDetails>
            </UserBannerContainer>
          </Banner>
          <Breadcrumb>
            <BreadcrumbItem href={"../../"} icon="home" title="Moderation" />
            <BreadcrumbItem title={user()?.username} icon="person" />
          </Breadcrumb>

          <Show when={user()?.application}>
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "4px",
                "margin-bottom": "10px",
              }}
            >
              <Text size={14} style={{ "margin-left": "0px" }}>
                Bot Created By
              </Text>
              <User
                user={botApplicationUser()}
                class={css`
                  border: none;
                  border-radius: 6px;
                  background: rgba(255, 255, 255, 0.05);
                `}
              />
            </div>
          </Show>

          <Show when={user()}>
            <FlexColumn
              class={css`
                margin-bottom: 10px;
              `}
            >
              <Show when={!user()?.shadowBan}>
                <SuspendOrUnsuspendBlock user={user()!} setUser={setUser} />
              </Show>
              <Show when={user()?.account}>
                <Show when={!user()?.shadowBan}>
                  <WarnBlock user={user()!} setUser={setUser} />
                </Show>
                <Show when={!user()?.suspension}>
                  <ShadowBanBlock user={user()!} setUser={setUser} />
                </Show>
              </Show>
            </FlexColumn>
          </Show>

          <Show when={user()?.account}>
            <SettingsBlock label="Email" icon="email">
              <Input
                value={inputValues().email}
                onText={(v) => setInputValue("email", v)}
              />
            </SettingsBlock>

            <SettingsBlock label="Email Confirmed">
              <Checkbox
                checked={inputValues().emailConfirmed}
                onChange={(checked) => setInputValue("emailConfirmed", checked)}
              />
            </SettingsBlock>
          </Show>

          <SettingsBlock label="Username" icon="face">
            <Input
              value={inputValues().username}
              onText={(v) => setInputValue("username", v)}
            />
          </SettingsBlock>
          <SettingsBlock label="Tag" icon="local_offer">
            <Input
              value={inputValues().tag}
              onText={(v) => setInputValue("tag", v)}
            />
          </SettingsBlock>
          <SettingsBlock icon="badge" label="Badges" header />
          <FlexColumn gap={1}>
            <For each={Object.values(USER_BADGES)}>
              {(badge) => (
                <BadgeItem
                  badge={badge}
                  user={user()!}
                  badges={inputValues().badges}
                  onBadgeUpdate={onBadgeUpdate}
                />
              )}
            </For>
          </FlexColumn>
          <ChangePasswordButton
            onClick={onChangePasswordClick}
            style={{ "margin-bottom": "5px", "margin-top": "5px" }}
          >
            Change Password
          </ChangePasswordButton>

          <Show when={showChangePassword()}>
            <SettingsBlock
              icon="password"
              label="New Password"
              description="Changing the password will log them out everywhere."
            >
              <Input
                type="password"
                value={inputValues().newPassword}
                onText={(v) => setInputValue("newPassword", v)}
              />
            </SettingsBlock>
          </Show>

          <Show when={Object.keys(updatedInputValues()).length}>
            <SettingsBlock
              label="Confirm Admin Password"
              icon="security"
              class={css`
                margin-top: 10px;
              `}
            >
              <Input
                type="password"
                value={inputValues().password}
                onText={(v) => setInputValue("password", v)}
              />
            </SettingsBlock>
            <Show when={error()}>
              <Text color="var(--alert-color)">{error()}</Text>
            </Show>

            <Button
              iconName="save"
              label={requestStatus()}
              class={css`
                align-self: flex-end;
              `}
              onClick={onSaveButtonClicked}
            />
          </Show>

          <UsersWithSameIPAddress userId={user()?.id!} />
          <UserServersList userId={user()?.id!} servers={user()?.servers!} />

          <AuditLogPane search={user()?.id!} style={{ margin: 0 }} />
        </UserPageInnerContainer>
      </UserPageContainer>
    </Show>
  );
}

const BadgeItem = (props: {
  badge: Bitwise;
  user: RawUser;
  badges: number;
  onBadgeUpdate: (checked: boolean, badgeBit: number) => void;
}) => {
  const [hovered, setHovered] = createSignal(false);
  return (
    <SettingsBlock
      onMouseOver={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      class={BadgeItemStyles}
      label={props.badge.name}
      description={props.badge.description}
      icon={
        <Avatar
          user={{ ...props.user, badges: props.badge.bit }}
          size={42}
          animate={hovered()}
        />
      }
    >
      <Checkbox
        checked={hasBit(props.badges, props.badge.bit)}
        onChange={(checked) => props.onBadgeUpdate(checked, props.badge.bit)}
      />
    </SettingsBlock>
  );
};

const UsersWithSameIPAddressContainer = styled(FlexColumn)`
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 10px;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
`;

const UsersWithSameIPAddress = (props: { userId: string }) => {
  const [users, setUsers] = createSignal<ModerationUser[]>([]);

  onMount(() => {
    getUsersWithSameIPAddress(props.userId, 30).then(setUsers);
  });

  return (
    <FlexColumn>
      <SettingsBlock
        icon="dns"
        borderBottomRadius={false}
        label="Users With Same IP Address"
      />
      <UsersWithSameIPAddressContainer>
        <For each={users()}>{(user) => <User user={user} />}</For>
      </UsersWithSameIPAddressContainer>
    </FlexColumn>
  );
};
const UserServersList = (props: {
  userId: string;
  servers: RawServer & { createdBy: RawUser }[];
}) => {
  const sortOwnedFirst = () => {
    return props.servers.sort((a, b) => {
      if (a.createdBy.id === props.userId) return -1;
      if (b.createdBy.id === props.userId) return 1;
      return 0;
    });
  };

  return (
    <FlexColumn>
      <SettingsBlock
        icon="dns"
        borderBottomRadius={false}
        label="Joined Servers"
      />
      <UsersWithSameIPAddressContainer>
        <For each={sortOwnedFirst()}>
          {(server) => <Server server={server} />}
        </For>
      </UsersWithSameIPAddressContainer>
    </FlexColumn>
  );
};

function SuspendOrUnsuspendBlock(props: {
  user: ModerationUser;
  setUser: (user: ModerationUser) => void;
}) {
  const { createPortal } = useCustomPortal();

  const showSuspendModal = () => {
    createPortal?.((close) => (
      <SuspendUsersModal
        done={(suspension) => props.setUser({ ...props.user!, suspension })}
        close={close}
        users={[props.user]}
      />
    ));
  };
  const showEditModal = () => {
    createPortal?.((close) => (
      <EditUserSuspensionModal
        done={(suspension) => props.setUser({ ...props.user!, suspension })}
        close={close}
        user={props.user}
        suspension={props.user.suspension}
      />
    ));
  };

  const showUnsuspendModal = () => {
    createPortal?.((close) => (
      <UnsuspendUsersModal
        done={() => props.setUser({ ...props.user!, suspension: undefined })}
        close={close}
        users={[props.user]}
      />
    ));
  };

  const expiredAt = () => {
    if (!props.user.suspension?.expireAt) return "Never";

    return formatTimestamp(props.user.suspension.expireAt);
  };

  const suspendedAt = () => {
    return formatTimestamp(props.user.suspension?.suspendedAt!);
  };

  const Description = () => (
    <span>
      <Text size={12} opacity={0.8}>
        By{" "}
      </Text>
      <Text size={12} opacity={0.6}>
        {props.user.suspension?.suspendBy.username}
      </Text>

      <br />

      <Text size={12} opacity={0.8}>
        At{" "}
      </Text>
      <Text size={12} opacity={0.6}>
        {suspendedAt()}
      </Text>

      <br />

      <Text size={12} opacity={0.8}>
        {" "}
        Expires
      </Text>
      <Text size={12} opacity={0.6}>
        {" "}
        {expiredAt()}
      </Text>
    </span>
  );

  return (
    <div>
      <Show when={!props.user?.suspension}>
        <SettingsBlock
          icon="block"
          label="Suspend"
          description={"Deny this user to access Nerimity"}
        >
          <Button
            onClick={showSuspendModal}
            label="Suspend"
            color="var(--alert-color)"
            primary
          />
        </SettingsBlock>
      </Show>

      <Show when={props.user?.suspension}>
        <SettingsBlock
          icon="block"
          label={`Suspended for: ${props.user.suspension?.reason}`}
          description={<Description />}
        >
          <FlexColumn gap={4}>
            <Button onClick={showEditModal} label="Edit" margin={0} />
            <Button
              onClick={showUnsuspendModal}
              label="Unsuspend"
              color="var(--alert-color)"
              primary
              margin={0}
            />
          </FlexColumn>
        </SettingsBlock>
      </Show>
    </div>
  );
}
function WarnBlock(props: {
  user: ModerationUser;
  setUser: (user: ModerationUser) => void;
}) {
  const { createPortal } = useCustomPortal();

  const expired = () =>
    !props.user.account?.warnExpiresAt
      ? true
      : new Date(props.user.account.warnExpiresAt) < new Date();
  const warnCount = () => (expired() ? 0 : props.user.account?.warnCount || 0);

  const showWarnModal = () => {
    createPortal?.((close) => (
      <WarnUserModal
        done={() =>
          props.setUser({
            ...props.user,
            account: {
              ...props.user.account,
              warnCount: warnCount() + 1,
              warnExpiresAt: new Date().setMonth(new Date().getMonth() + 6),
            },
          })
        }
        close={close}
        user={props.user}
      />
    ));
  };

  const Description = () => (
    <span>
      <Text size={12} opacity={0.6}>
        Warned
      </Text>
      <Text size={12} opacity={0.8}>
        {" "}
        {warnCount()}{" "}
      </Text>
      <Text size={12} opacity={0.6}>
        time(s) in the last 6 months.
      </Text>
    </span>
  );

  return (
    <div>
      <SettingsBlock
        icon="warning"
        label="Warn User"
        description={<Description />}
      >
        <FlexColumn gap={4}>
          <Button
            onClick={showWarnModal}
            label="Warn User"
            color="var(--warn-color)"
            primary
            margin={0}
          />
        </FlexColumn>
      </SettingsBlock>
    </div>
  );
}
function ShadowBanBlock(props: {
  user: ModerationUser;
  setUser: (user: ModerationUser) => void;
}) {
  const { createPortal } = useCustomPortal();

  const showShadowBanModal = () => {
    createPortal?.((close) => (
      <ShadowBanUserModal
        done={() =>
          props.setUser({
            ...props.user,
            shadowBan: true,
          })
        }
        close={close}
        user={props.user}
      />
    ));
  };

  const showUndoModal = () => {
    createPortal?.((close) => (
      <UndoShadowBanUserModal
        done={() =>
          props.setUser({
            ...props.user,
            shadowBan: false,
          })
        }
        close={close}
        user={props.user}
      />
    ));
  };

  return (
    <div>
      <SettingsBlock
        icon="tonality"
        label="Shadow Ban (Raid/Spammers)"
        description={"New messages and posts will be hidden and not be sent."}
      >
        <FlexColumn gap={4}>
          <Show when={!props.user?.shadowBan}>
            <Button
              onClick={showShadowBanModal}
              label="Shadow Ban"
              color="var(--warn-color)"
              primary
              margin={0}
            />
          </Show>
          <Show when={props.user?.shadowBan}>
            <Button
              onClick={showUndoModal}
              label="Undo"
              color="var(--alert-color)"
              primary
              margin={0}
            />
          </Show>
        </FlexColumn>
      </SettingsBlock>
    </div>
  );
}
