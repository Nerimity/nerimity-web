import {
  createEffect,
  For,
  JSXElement,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import Input from "../ui/input/Input";
import { Modal } from "../ui/modal";
import style from "./QuickTravel.module.scss";
import Avatar from "../ui/Avatar";
import RouterEndpoints from "@/common/RouterEndpoints";
import { CustomLink } from "../ui/CustomLink";
import Icon from "../ui/icon/Icon";
import { cn } from "@/common/classNames";
import {
  QuickTravelControllerProvider,
  SearchItem,
  useQuickTravelController,
} from "./QuickTravelController";
import { t } from "i18next";

export function QuickTravel(props: { close: () => void }) {
  return (
    <QuickTravelControllerProvider>
      <Modal.Root close={props.close} class={style.quickTravelRoot}>
        <Modal.Body class={style.quickTravelBody}>
          <Body close={props.close} />
        </Modal.Body>
      </Modal.Root>
    </QuickTravelControllerProvider>
  );
}

const Body = (props: { close: () => void }) => {
  const controller = useQuickTravelController();

  return (
    <>
      <Input
        class={style.quickTravelInput}
        placeholder={t("inbox.drawer.searchModalPlaceholder")}
        ref={(el) => controller?.setInputRef(el as HTMLInputElement)}
        onText={controller?.setInputValue}
      />

      <div class={style.items}>
        <For each={controller?.items}>
          {(item, i) => (
            <Item
              close={props.close}
              item={item}
              selected={i() === controller?.selectedIndex()}
              onMouseMove={() => controller?.setSelectedIndex(i())}
            />
          )}
        </For>
      </div>
    </>
  );
};

const Item = (props: {
  item: SearchItem;
  close: () => void;
  selected: boolean;
  onMouseMove?: () => void;
}) => {
  let itemRef: HTMLAnchorElement | undefined;

  createEffect(() => {
    if (props.selected) {
      itemRef?.scrollIntoView({
        block: "nearest",
        inline: "start",
      });
    }
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (props.selected && e.key === "Enter") {
      itemRef?.click();
    }
  };

  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown);
    });
  });

  return (
    <CustomLink
      ref={itemRef}
      onClick={props.close}
      class={cn(style.quickTravelItem, props.selected && style.selected)}
      href={props.item.path || RouterEndpoints.PROFILE(props.item.id!)}
      onMouseMove={props.onMouseMove}
    >
      <div class={style.icon}>
        <Show when={props.item.user || props.item.server}>
          <Avatar
            resize={40}
            server={props.item.server}
            user={props.item.user}
            size={24}
          />
        </Show>
        <Show when={typeof props.item.icon === "string"}>
          <Icon name={props.item.icon as string} size={24} />
        </Show>
        <Show when={typeof props.item.icon === "function"}>
          {(props.item.icon as () => JSXElement)()}
        </Show>
      </div>
      <div class={style.label}>{props.item.name}</div>
      <div class={style.subText}>{props.item.subText}</div>
    </CustomLink>
  );
};
