import { For, Show, createEffect, createSignal, onMount } from "solid-js";
import { styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "@nerimity/i18lite";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import Button from "../ui/Button";
import {
  createGoogleAccountLink,
  unlinkAccountWithGoogle,
} from "@/chat-api/services/UserService";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import {
  OAuth2AuthorizedApplication,
  OAuth2AuthorizedApplications,
  OAuth2Unauthorize,
} from "@/chat-api/services/OAuthService";
import Avatar from "../ui/Avatar";
import Text from "../ui/Text";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export default function ConnectionsSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Connections",
      iconName: "settings",
    });
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.connections")} />
      </Breadcrumb>
      <Connections />
      <ThirdPartyConnections />
    </Container>
  );
}

function Connections() {
  return (
    <>
      <GoogleLink />
    </>
  );
}

function ThirdPartyConnections() {
  const [connections, setConnections] = createSignal<
    OAuth2AuthorizedApplication[]
  >([]);

  onMount(() => {
    OAuth2AuthorizedApplications().then(setConnections);
  });

  return (
    <FlexColumn>
      <SettingsBlock
        header={connections().length > 0}
        icon="info"
        label="Third Party Connections"
      >
        <Text opacity={0.6} size={12}>
          {connections().length} Connections
        </Text>
      </SettingsBlock>
      <For each={connections()}>
        {(connection, i) => (
          <ThirdPartyConnectionItem
            onUnauthorize={() => {
              setConnections(
                connections().filter((c) => c.id !== connection.id)
              );
            }}
            connection={connection}
            borderBottomRadius={i() === connections().length - 1}
          />
        )}
      </For>
    </FlexColumn>
  );
}

const ThirdPartyConnectionItem = (props: {
  connection: OAuth2AuthorizedApplication;
  borderBottomRadius: boolean;
  onUnauthorize: () => void;
}) => {
  const application = () => props.connection.application;

  const [requestSent, setRequestSent] = createSignal(false);

  const unauthorizeClick = () => {
    if (requestSent()) return;
    setRequestSent(true);
    OAuth2Unauthorize(application().id)
      .then(() => {
        props.onUnauthorize();
      })
      .catch((err) => {
        alert(err.message);
      })
      .finally(() => setRequestSent(false));
  };

  return (
    <SettingsBlock
      borderTopRadius={false}
      label={application().name}
      icon={
        <Avatar
          size={36}
          user={{
            username: application().name,
            hexColor: application().botUser?.hexColor || "white",
            avatar: application().botUser?.avatar,
          }}
        />
      }
    >
      <Button
        label={requestSent() ? "Un-authorizing..." : "Unauthorize"}
        alert
        iconName="link_off"
        iconSize={16}
        onClick={unauthorizeClick}
      />
    </SettingsBlock>
  );
};

function GoogleLink() {
  const { account } = useStore();
  const isConnected = () =>
    account.user()?.connections?.find((c) => c.provider === "GOOGLE");

  const linkGoogle = () => {
    createGoogleAccountLink()
      .then((url) => {
        window.open(url, "_blank");
      })
      .catch((err) => {
        alert(err.message);
      });
  };
  const unlinkGoogle = async () => {
    await unlinkAccountWithGoogle().catch((err) => {
      alert(err.message);
    });
  };

  return (
    <SettingsBlock
      iconSrc="/assets/Google.svg"
      label="Google"
      description="Linking your Google account will allow you to upload files in Nerimity. Files will be stored in your Google Drive."
    >
      <Show when={!isConnected()}>
        <Button label="Link" iconName="link" onClick={linkGoogle} />
      </Show>
      <Show when={isConnected()}>
        <Button
          label="Unlink"
          color="var(--alert-color)"
          iconName="link_off"
          onClick={unlinkGoogle}
        />
      </Show>
    </SettingsBlock>
  );
}
