import {
  createEffect,
  createMemo,
  lazy,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import { getCurrentLanguage, getLanguage } from "./locales/languages";
import { useTransContext } from "@mbarzda/solid-i18next";
import { electronWindowAPI, spellcheckSuggestions } from "./common/Electron";
import { ElectronTitleBar } from "./components/ElectronTitleBar";
import { useMatch } from "solid-navigator";
import { useReactNativeEvent } from "./common/ReactNative";
import { registerFCM } from "./chat-api/services/UserService";
import { useCustomPortal } from "./components/ui/custom-portal/CustomPortal";
import ContextMenu, {
  ContextMenuItem,
} from "./components/ui/context-menu/ContextMenu";
import { Delay } from "./common/Delay";
import useStore from "./chat-api/store/useStore";

const RemindersModal = lazy(
  () => import("./components/reminders-modal/RemindersModal")
);

const ConnectingStatusHeader = lazy(
  () => import("@/components/connecting-status-header/ConnectingStatusHeader")
);

const InAppNotificationPreviews = lazy(
  () => import("@/components/in-app-notification-previews")
);

export default function App() {
  const [, actions] = useTransContext();
  const isAppPage = useMatch(() => "/app/*");

  useElectronContextMenu();

  useReminderService();

  useReactNativeEvent(["registerFCM"], (e) => {
    registerFCM(e.token);
  });

  onMount(() => {
    setLanguage();
  });

  const setLanguage = async () => {
    const key = getCurrentLanguage();
    if (!key) return;
    if (key === "en_gb") return;
    const language = await getLanguage(key);
    if (!language) return;
    actions.addResources(key, "translation", language);
    actions.changeLanguage(key);
  };

  return (
    <>
      <Show when={electronWindowAPI()?.isElectron}>
        <ElectronTitleBar />
      </Show>
      <Show when={isAppPage()}>
        <ConnectingStatusHeader />
        <InAppNotificationPreviews />
      </Show>
    </>
  );
}

const useElectronContextMenu = () => {
  if (!electronWindowAPI()?.isElectron) return;
  const { createPortal } = useCustomPortal();

  const onContextMenu = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const input = target?.closest("input, textarea") as HTMLInputElement;
    if (!input) return;

    const position = { x: event.clientX, y: event.clientY };

    createPortal(
      (close) => (
        <InputContextMenu input={input} close={close} position={position} />
      ),
      "input-context-menu"
    );
  };

  onMount(() => {
    document.addEventListener("contextmenu", onContextMenu);
    onCleanup(() => {
      document.removeEventListener("contextmenu", onContextMenu);
    });
  });
};

const InputContextMenu = (props: {
  close: () => void;
  position: { x: number; y: number };
  input: HTMLInputElement;
}) => {
  const contextMenuItems = createMemo(() => {
    const items: ContextMenuItem[] = [
      ...spellcheckSuggestions().map((suggestion) => ({
        id: suggestion,
        label: suggestion,
        icon: "spellcheck",
        onClick: () => electronWindowAPI()?.replaceMisspelling(suggestion),
      })),
    ];

    if (items.length) {
      items.push({ separator: true });
    }

    const selection = getSelection();
    const highlighted = selection?.toString();

    if (highlighted) {
      items.push({
        id: "copy",
        label: "Copy",
        icon: "content_copy",
        onClick: () => {
          props.input.focus();
          electronWindowAPI()?.clipboardCopy(highlighted);
        },
      });
      items.push({
        id: "cut",
        label: "Cut",
        icon: "content_cut",
        onClick: () => {
          props.input.focus();
          electronWindowAPI()?.clipboardCut();
        },
      });
    }

    items.push({
      id: "paste",
      label: "Paste",
      icon: "content_paste",
      onClick: () => {
        props.input.focus();
        electronWindowAPI()?.clipboardPaste();
      },
    });

    return items;
  });

  return (
    <Delay ms={1}>
      <ContextMenu
        onClose={props.close}
        position={props.position}
        items={contextMenuItems()}
      />
    </Delay>
  );
};

const useReminderService = () => {
  const store = useStore();
  const { createPortal } = useCustomPortal();
  const reminders = createMemo(() => store.account.reminders());

  const isAuthenticated = createMemo(() => store.account.isAuthenticated());
  let timeoutId: number;

  createEffect(
    on([reminders, isAuthenticated], () => {
      if (isAuthenticated()) {
        reminderService(checkReminders());
      }
    })
  );
  onCleanup(() => {
    window.clearTimeout(timeoutId);
  });

  const checkReminders = () => {
    const latestReminder = reminders()[0];
    if (!latestReminder) return 10000;
    const now = Date.now();

    const isActive = latestReminder.remindAt <= now;

    if (isActive) {
      createPortal(
        (close) => <RemindersModal close={close} />,
        "reminders-modal"
      );
    }

    const isInMinute = latestReminder?.remindAt - now < 60 * 1000;
    return isInMinute ? 1000 : 10000;
  };

  const reminderService = (delay: number) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      const nextCheckTime = checkReminders();
      reminderService(nextCheckTime);
    }, delay);
  };
};
