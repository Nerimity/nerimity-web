import {
  addBit,
  Bitwise,
  hasBit,
  removeBit,
  ROLE_PERMISSIONS,
} from "@/chat-api/Bitwise";
import env from "@/common/env";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import { CustomLink } from "@/components/ui/CustomLink";
import { FlexRow } from "@/components/ui/Flexbox";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import { t } from "@nerimity/i18lite";
import { createEffect, createSignal, For, Show } from "solid-js";
import { css } from "solid-styled-components";

export const ApplicationBotCreateLinkBlock = (props: {
  appId?: string;
  value?: number;
  hideUrlBar?: boolean;
  onChange?: (perm: number) => void;
}) => {
  const [permissions, setPermissions] = createSignal(
    props.value ?? ROLE_PERMISSIONS.SEND_MESSAGE.bit
  );

  const permissionsList = Object.values(ROLE_PERMISSIONS) as Bitwise[];

  const link = () => {
    return `${env.APP_URL}/bot/${props.appId}?perms=${permissions()}`;
  };

  createEffect(() => {
    setPermissions(props.value ?? ROLE_PERMISSIONS.SEND_MESSAGE.bit);
  });

  createEffect(() => {
    props.onChange?.(permissions());
  });

  const onPermissionChanged = (checked: boolean, bit: number) => {
    if (checked) {
      setPermissions(addBit(permissions(), bit));
    } else {
      setPermissions(removeBit(permissions(), bit));
    }
  };
  return (
    <div>
      <SettingsBlock
        icon="security"
        label={t("servers.settings.drawer.permissions")}
        description={t("settings.developer.bot.permissionsDescription")}
        header={true}
        class={css`
          flex-wrap: wrap;
          gap: 8px;
        `}
      >
        <Show when={!props.hideUrlBar}>
          <FlexRow
            itemsCenter
            gap={4}
            style={{
              background: "rgba(0,0,0,0.4)",
              "padding-left": "8px",
              "border-radius": "8px",
            }}
          >
            <CustomLink
              style={{ "font-size": "12px" }}
              target="_blank"
              rel="noopener noreferrer"
              decoration
              href={link()}
            >
              {link()}
            </CustomLink>
            <Button
              iconName="content_copy"
              iconSize={18}
              onClick={() => navigator.clipboard.writeText(link())}
            />
          </FlexRow>
        </Show>
      </SettingsBlock>
      <For each={permissionsList}>
        {(permission, i) => (
          <SettingsBlock
            borderTopRadius={false}
            borderBottomRadius={i() === permissionsList.length - 1}
            icon={permission.icon}
            label={permission.name()}
            description={permission.description?.()}
          >
            <Checkbox
              checked={hasBit(permissions(), permission.bit)}
              onChange={(checked) =>
                onPermissionChanged(checked, permission.bit)
              }
            />
          </SettingsBlock>
        )}
      </For>
    </div>
  );
};
