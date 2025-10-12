import useStore from "@/chat-api/store/useStore";
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  JSX,
  lazy,
  on,
  onCleanup,
  useContext,
} from "solid-js";
import { useCustomPortal } from "./ui/custom-portal/CustomPortal";
import { getCustomSound, playSound } from "@/common/Sound";

const RemindersModal = lazy(() => import("./reminders-modal/RemindersModal"));

const ReminderContext = createContext({
  hasActiveReminder: () => false,
});

export const ReminderProvider = (props: { children: JSX.Element }) => {
  const [hasActiveReminder, setHasActiveReminder] = createSignal(false);

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

    setHasActiveReminder(isActive);

    if (isActive) {
      playSound(getCustomSound("REMINDER"));
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

  return (
    <ReminderContext.Provider value={{ hasActiveReminder: hasActiveReminder }}>
      {props.children}
    </ReminderContext.Provider>
  );
};

export const useReminders = () => useContext(ReminderContext);
