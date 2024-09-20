import { createEffect, createSignal, Match, on, Show, Switch } from "solid-js";
import Icon from "../ui/icon/Icon";
import style from "./InAppNotificationPreviews.module.scss";
import { useInAppNotificationPreviews } from "./useInAppNotificationPreviews";
import { Markup } from "../Markup";
import Avatar from "../ui/Avatar";

export default function InAppNotificationPreviews() {
  const { notifications, removeNotification } = useInAppNotificationPreviews();
  const [progressEl, setProgressEl] = createSignal<HTMLDivElement>();

  const notification = () => notifications()[0];

  createEffect(
    on([notification, progressEl], () => {
      const progressElement = progressEl();
      if (!notification()) return;
      if (!progressElement) return;
      const anim = progressElement.animate(
        [
          { composite: "replace", width: "100%" },
          { composite: "replace", width: "0%" },
        ],
        { duration: 5000, fill: "forwards", endDelay: 300, delay: 300 }
      );
      anim.onfinish = () => {
        anim.cancel();
        // removeNotification(notification()!);
      };
    })
  );

  return (
    <Show when={notification()}>
      <div class={style.backgroundContainer}>
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
                <Markup text={notification()?.body || ""} inline />
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
      </div>
    </Show>
  );
}
