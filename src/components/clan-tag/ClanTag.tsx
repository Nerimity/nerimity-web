import style from "./ClanTag.module.css";
import { RawServerClan } from "@/chat-api/RawData";
import { Emoji } from "../ui/Emoji";
import { css, styled } from "solid-styled-components";
import { Modal } from "../ui/modal";
import { t } from "@nerimity/i18lite";
import Text from "../ui/Text";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { ServerInviteEmbed } from "../message-pane/message-item/MessageItem";

export const ClanTag = (props: { clan: RawServerClan; hovered?: boolean }) => {
  const { createPortal } = useCustomPortal();

  const openModal = (e: MouseEvent) => {
    e.stopPropagation();

    createPortal((c) => <DetailsModal clan={props.clan} close={c} />);
  };

  return (
    <div class={style.clanTag} onClick={openModal}>
      <Emoji
        size={14}
        icon={props.clan.icon}
        defaultPaused={true}
        hovered={props.hovered}
      />
      {props.clan.tag}
    </div>
  );
};

const DetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  overflow: hidden;
  gap: 8px;
  position: relative;
  align-self: center;
  min-width: 260px;
`;

const MainContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(255, 255, 255, 0.02);
  padding: 6px;
  padding-left: 8px;
  padding-right: 8px;
  border-bottom: solid 1px rgba(255, 255, 255, 0.2);

  word-break: break-word;
  white-space: pre-wrap;
  padding-bottom: 8px;
`;

const NameContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

function DetailsModal(props: { close: () => void; clan: RawServerClan }) {
  return (
    <Modal.Root close={props.close}>
      <Modal.Header icon="face" title={t("clanModal.title")} />
      <DetailsContainer>
        <MainContainer>
          <Emoji size={40} icon={props.clan.icon} />
          <NameContainer>
            <Text size={18}>
              <Text size={18}>{props.clan.tag}</Text>
            </Text>
          </NameContainer>
        </MainContainer>

        <ServerInviteEmbed
          class={css`
            border: none;
            padding-top: 0;
            justify-content: center;
          `}
          clan
          code={props.clan.serverId}
        />
      </DetailsContainer>
    </Modal.Root>
  );
}
