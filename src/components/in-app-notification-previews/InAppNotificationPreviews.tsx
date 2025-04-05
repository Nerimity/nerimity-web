import {
  createEffect,
  createMemo,
  createSignal,
  Match,
  on,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import Icon from "../ui/icon/Icon";
import style from "./InAppNotificationPreviews.module.scss";
import { useInAppNotificationPreviews } from "./useInAppNotificationPreviews";
import { Markup } from "../Markup";
import Avatar from "../ui/Avatar";
import RouterEndpoints from "@/common/RouterEndpoints";
import { Dynamic } from "solid-js/web";
import { CustomLink } from "../ui/CustomLink";
import { cn } from "@/common/classNames";
import Button from "../ui/Button";
import { useWindowProperties } from "@/common/useWindowProperties";
import useStore from "@/chat-api/store/useStore";
import { getSystemMessage } from "@/common/SystemMessage";

export default function InAppNotificationPreviews() {
  const { notifications, removeNotification, pushNotification } =
    useInAppNotificationPreviews();
  const [progressEl, setProgressEl] = createSignal<HTMLDivElement>();
  const [expanded, setExpanded] = createSignal(false);
  const { isMobileAgent } = useWindowProperties();
  const store = useStore();

  const notification = () => notifications()[0];

  const systemMessage = createMemo(
    () =>
      notification()?.message &&
      getSystemMessage(notification?.()?.message?.type!)
  );

  let anim: Animation | undefined;

  createEffect(
    on([notification, progressEl, expanded], () => {
      anim?.cancel();
      const progressElement = progressEl();
      if (!notification()) {
        setExpanded(false);
        return;
      }
      if (!progressElement) return;

      anim = progressElement.animate(
        [
          { composite: "replace", width: "100%" },
          { composite: "replace", width: "0%" },
        ],
        { duration: 5000, fill: "forwards", endDelay: 300, delay: 300 }
      );

      if (expanded()) anim.pause();
      anim.onfinish = () => {
        anim?.cancel();
        removeNotification(notification()!);
        setExpanded(false);
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
  const onClick = (event: MouseEvent) => {
    if (event.target instanceof HTMLElement) {
      if (event.target.closest(".ipnpActions")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    notification()?.onClick?.();
    removeNotification(notification()!);
  };
  createEffect(
    on(expanded, () => {
      if (expanded()) {
        anim?.pause();
      } else {
        anim?.play();
      }
    })
  );

  const markAsRead = () => {
    store.channels.get(notification()?.channel?.id!)?.dismissNotification();
    removeNotification(notification()!);
  };
  const dismissNotification = () => {
    removeNotification(notification()!);
  };

  return (
    <Show when={notification()}>
      <Dynamic
        onClick={onClick}
        component={href() ? CustomLink : "div"}
        href={href()}
        class={cn(
          style.backgroundContainer,
          expanded() && style.expanded,
          isMobileAgent() && style.mobile
        )}
        onMouseOver={() => !isMobileAgent() && setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onContextMenu={(e: MouseEvent) => {
          e.preventDefault();
          setExpanded(true);
        }}
      >
        <div class={style.container}>
          <div class={style.innerContainer}>
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
                  <Markup
                    replaceCommandBotId
                    prefix={
                      <Show
                        when={
                          systemMessage() ||
                          notification()?.message?.attachments?.length
                        }
                      >
                        <Icon
                          name={systemMessage()?.icon || "attach_file"}
                          size={16}
                          style={{ "vertical-align": "sub" }}
                          color={
                            systemMessage()?.color || "rgba(255,255,255,0.6)"
                          }
                        />
                      </Show>
                    }
                    class={style.markup}
                    text={
                      systemMessage()?.message
                        ? `[@:${notification()?.message?.createdBy?.id}] ${
                            systemMessage()?.message
                          }`
                        : notification()?.body || ""
                    }
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
              />
            </div>
          </div>
          <div class={cn(style.actions, "ipnpActions")}>
            <div class={style.actionsContainer}>
              <Show when={notification()?.message}>
                <Button
                  label="Mark as Read"
                  title="Mark as Read"
                  onClick={markAsRead}
                  padding={3}
                  iconSize={16}
                  margin={0}
                  iconName="markunread_mailbox"
                />
              </Show>
              <Button
                label="Dismiss"
                title="Dismiss"
                onClick={dismissNotification}
                padding={3}
                iconSize={16}
                margin={0}
                iconName="close"
              />
            </div>
          </div>
        </div>
      </Dynamic>
    </Show>
  );
}
