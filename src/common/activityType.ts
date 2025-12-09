import { ActivityStatus } from "@/chat-api/RawData";
import { t } from "@nerimity/i18lite";

export interface ActivityType {
  icon: string;
  isMusic?: boolean;
  isGame?: boolean;
  isVideo?: boolean;
}

export function getActivityType(activity?: ActivityStatus): ActivityType {
  const isMusic =
    activity?.action.startsWith(t("activityNames.listening")) ||
    activity?.action.startsWith("Listening to");

  const isVideo =
    activity?.action.startsWith(t("activityNames.watching")) ||
    activity?.action.startsWith("Watching");

  if (isMusic) return { icon: "music_note", isMusic: true };

  if (isVideo) return { icon: "movie", isVideo: true };
  return { icon: "gamepad", isGame: true };
}
