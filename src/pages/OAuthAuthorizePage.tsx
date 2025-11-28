import PageHeader from "../components/PageHeader";
import { css, styled } from "solid-styled-components";
import PageFooter from "@/components/PageFooter";
import { For, Show, createSignal, onMount } from "solid-js";
import { StorageKeys, getStorageString } from "@/common/localStorage";
import RouterEndpoints from "@/common/RouterEndpoints";
import { A, useNavigate, useSearchParams } from "solid-navigator";

import Avatar from "@/components/ui/Avatar";
import Text from "@/components/ui/Text";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import Button from "@/components/ui/Button";
import { APPLICATION_SCOPES } from "@/chat-api/Bitwise";
import { t } from "@nerimity/i18lite";
import Checkbox from "@/components/ui/Checkbox";
import {
  OAuth2Details,
  Oauth2GetDetails,
} from "@/chat-api/services/OAuthService";
import { logout } from "@/common/logout";
import { CustomLink } from "@/components/ui/CustomLink";
import { formatTimestamp } from "@/common/date";

const HomePageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

const Content = styled("div")`
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 8px;
  margin-top: 0;
  margin-bottom: 0;
  border-radius: 8px;
  flex: 1;
  align-items: center;
`;

export default function OAuthAuthorizePage() {
  const [searchParams] = useSearchParams<{
    clientId: string;
    scopes: string;
    redirectUri: string;
  }>();

  const scopes = () =>
    searchParams.scopes ? searchParams.scopes.split(" ") : [];
  return (
    <HomePageContainer>
      <PageHeader />
      <Content class="content">
        <div
          style={{
            display: "flex",
            "padding-top": "20px",
            "padding-bottom": "20px",
            margin: "auto",
          }}
        >
          <OAuthAuthorizePopup
            scopes={scopes()}
            redirectUri={searchParams.redirectUri}
            clientId={searchParams.clientId}
          />
        </div>
      </Content>
      <PageFooter />
    </HomePageContainer>
  );
}

export const OAuthAuthorizePopup = (props: {
  clientId: string;
  scopes: string[];
  redirectUri: string;
}) => {
  const navigate = useNavigate();
  const [oAuth2Details, setOAuth2Details] = createSignal<OAuth2Details>();

  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null);

  onMount(async () => {
    if (!getStorageString(StorageKeys.USER_TOKEN, null)) {
      navigate(RouterEndpoints.LOGIN(location.pathname + location.search), {
        replace: true,
      });
      return;
    }

    if (!props.scopes.length) {
      setError("No scopes provided.");
      return;
    }

    const hasValidScopes = props.scopes.every((scope) => {
      return Object.keys(APPLICATION_SCOPES).includes(scope);
    });

    if (!hasValidScopes) {
      setError("Invalid scopes provided.");
      return;
    }

    Oauth2GetDetails({
      clientId: props.clientId,
      redirectUri: props.redirectUri,
    })
      .then((data) => setOAuth2Details(data))
      .catch((err) => setError(err.message));
  });

  const addBot = async () => {};
  return (
    <FlexColumn
      style={{
        overflow: "auto",
        margin: "auto",
      }}
      gap={12}
    >
      <Show when={oAuth2Details()}>
        <div
          style={{
            "text-align": "center",
            "font-weight": "bold",
            "font-size": "20px",
            "margin-bottom": "50px",
          }}
        >
          {oAuth2Details()?.application.name} wants to access your account
        </div>
        <FlexRow gap={60} justifyCenter>
          <UserDisplay
            user={
              oAuth2Details()?.application.botUser
                ? {
                    hexColor: "white",
                    ...oAuth2Details()?.application.botUser,
                    username: oAuth2Details()?.application.name!,
                  }
                : {
                    hexColor: "white",
                    username: oAuth2Details()?.application.name!,
                  }
            }
          />
          <UserDisplay user={oAuth2Details()?.user} self />
        </FlexRow>

        <ScopesList scopes={props.scopes} />

        <FlexColumn
          gap={4}
          style={{ "font-size": "12px", "text-decoration": "none" }}
        >
          <span>
            <span style={{ opacity: "0.6", "margin-right": "4px" }}>
              App created by
            </span>
            <a
              target="_blank"
              href={RouterEndpoints.PROFILE(
                oAuth2Details()?.application.creatorAccount?.user.id!
              )}
            >
              {oAuth2Details()?.application.creatorAccount?.user.username}
            </a>
          </span>
          <span>
            <span style={{ opacity: "0.6", "margin-right": "4px" }}>
              App created at
            </span>
            <span>
              {formatTimestamp(oAuth2Details()?.application.createdAt!)}
            </span>
          </span>
        </FlexColumn>
      </Show>
      <Show when={error()}>
        <Text color="var(--alert-color)">{error()}</Text>
      </Show>
      <Show when={successMessage()}>
        <Text color="var(--success-color)">{successMessage()}</Text>
      </Show>
      <Show when={oAuth2Details()}>
        <Button
          label={t("oauth2.AuthorizeButton")}
          iconName="check"
          primary
          margin={[10, 0, 0, 0]}
          styles={{ "align-self": "stretch" }}
          onClick={addBot}
        />
      </Show>
    </FlexColumn>
  );
};

const UserDisplay = (props: {
  user?: {
    username: string;
    avatar?: string;
    hexColor: string;
    badges?: number;
  };
  self?: boolean;
}) => {
  const navigate = useNavigate();
  const logoutClick = async () => {
    await logout(false);
    navigate(RouterEndpoints.LOGIN(location.pathname + location.search), {
      replace: true,
    });
  };
  return (
    <FlexColumn itemsCenter gap={14}>
      <Avatar user={props.user} size={100} />
      <FlexColumn itemsCenter gap={4}>
        <Text>{props.user?.username}</Text>
        <Show when={props.self}>
          <CustomLink
            style={{ "font-size": "14px" }}
            decoration
            href="#"
            onClick={logoutClick}
          >
            Logout
          </CustomLink>
        </Show>
      </FlexColumn>
    </FlexColumn>
  );
};

const ScopesList = (props: { scopes: string[] }) => {
  return (
    <FlexColumn
      gap={8}
      class={css`
        flex: 1;
        width: 100%;
      `}
    >
      <Text opacity={0.8}>{t("oauth2.permissions")}</Text>
      <FlexColumn gap={12}>
        <For each={Object.keys(APPLICATION_SCOPES)}>
          {(scopeKey) => (
            <FlexRow gap={8}>
              <Checkbox
                style={{ "pointer-events": "none" }}
                disableLocalUpdate
                checked={props.scopes.includes(scopeKey)}
                label={APPLICATION_SCOPES[
                  scopeKey as keyof typeof APPLICATION_SCOPES
                ].description()}
              />
            </FlexRow>
          )}
        </For>
      </FlexColumn>
    </FlexColumn>
  );
};
