import style from "./ClanTag.module.css";
import { RawServerClan } from "@/chat-api/RawData";
import { Emoji } from "../ui/Emoji";

export const ClanTag = (props: { clan: RawServerClan }) => {
  return (
    <div class={style.clanTag}>
      <Emoji size={14} icon={props.clan.icon} />
      {props.clan.tag}
    </div>
  );
};
