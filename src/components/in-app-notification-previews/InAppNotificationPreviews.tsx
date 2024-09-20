import { createEffect, createSignal, Match, on, Show, Switch } from "solid-js";
import Icon from "../ui/icon/Icon";
import style from "./InAppNotificationPreviews.module.scss";
import { useInAppNotificationPreviews } from "./useInAppNotificationPreviews";
import { Markup } from "../Markup";
import Avatar from "../ui/Avatar";
import RouterEndpoints from "@/common/RouterEndpoints";
import { Dynamic } from "solid-js/web";
import { CustomLink } from "../ui/CustomLink";

export default function InAppNotificationPreviews() {
  const { notifications, removeNotification } = useInAppNotificationPreviews();
  const [progressEl, setProgressEl] = createSignal<HTMLDivElement>();

  const notification = () => notifications()[0];

  let anim: Animation | undefined;

  createEffect(
    on([notification, progressEl], () => {
      anim?.cancel();
      const progressElement = progressEl();
      if (!notification()) return;
      if (!progressElement) return;
      anim = progressElement.animate(
        [
          { composite: "replace", width: "100%" },
          { composite: "replace", width: "0%" },
        ],
        { duration: 5000, fill: "forwards", endDelay: 300, delay: 300 }
      );
      anim.onfinish = () => {
        anim?.cancel();
        removeNotification(notification()!);
      };
    })
  );

  const href = () => {
    const message = notification()?.message;
    const channel = notification()?.channel;
    const serverId = channel?.serverId;

    if (!message) return;
    if (serverId) {
      return RouterEndpoints.SERVER_MESSAGES(serverId, message.channelId);
    }
    const inboxChannelId = channel?.recipient()?.inboxChannelId;
    if (inboxChannelId) {
      return RouterEndpoints.INBOX_MESSAGES(inboxChannelId);
    }
  };
  const onClick = () => {
    notification()?.onClick?.();
    removeNotification(notification()!);
  };

  return (
    <Show when={notification()}>
      <Dynamic
        onClick={onClick}
        component={href() ? CustomLink : "div"}
        href={href()}
        class={style.backgroundContainer}
      >
        <div class={style.container}>
          <div class={style.infoContainer}>
            <Switch>
              <Match when={notification()?.message}>
                <Avatar
                  class={style.avatar}
                  size={28}
                  user={notification()?.message?.createdBy!}
                />
              </Match>
              <Match when={true}>
                <Icon
                  size={28}
                  name={notification()?.icon || "info"}
                  color={notification()?.color || "var(--primary-color)"}
                />
              </Match>
            </Switch>
            <div class={style.info}>
              <div class={style.title}>{notification()?.title}</div>
              <div class={style.body}>
                <Show when={notification()?.message?.attachments?.length}>
                  <Icon
                    name="attach_file"
                    size={16}
                    color="rgba(255,255,255,0.6)"
                  />
                </Show>
                <Markup
                  class={style.markup}
                  text={notification()?.body || ""}
                  inline
                />
              </div>
            </div>
          </div>
          <div class={style.progressBar}>
            <div
              ref={setProgressEl}
              class={style.progress}
              style={{
                "background-color":
                  notification()?.color || "var(--primary-color)",
              }}
            ></div>
          </div>
        </div>
      </Dynamic>
    </Show>
  );
}
