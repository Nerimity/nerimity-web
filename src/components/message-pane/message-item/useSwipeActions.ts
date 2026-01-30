import { MessageType, RawMessage } from "@/chat-api/RawData";
import useStore from "@/chat-api/store/useStore";
import { createMemo, createSignal } from "solid-js";

interface SwipeActionsProps {
  message: RawMessage;
  allowSwipeActions?: boolean;
  textAreaEl?: HTMLTextAreaElement | null;
  messageItemRef?: HTMLDivElement | undefined;
}

export const useSwipeActions = (_opts: () => SwipeActionsProps) => {
  const opts = createMemo(_opts);
  const store = useStore();

  const [swipeAction, setSwipeAction] = createSignal<"none" | "reply" | "edit">(
    "none"
  );
  let animationFrame: number;
  let startX = 0;
  let currentX = 0;
  let isSwiping = false;

  const EDIT_THRESHOLD = 80;
  const REPLY_THRESHOLD = 150;
  const SWIPE_TRIGGER_THRESHOLD = 30;
  let hasStartedSwiping = false;

  const canEditSwipe = () =>
    store.account.user()?.id === opts().message.createdBy.id &&
    opts().message.type === MessageType.CONTENT;

  const handleTouchStart = (e: TouchEvent) => {
    if (!opts().allowSwipeActions) return;
    startX = e.touches[0]?.clientX || 0;
    currentX = startX;
    isSwiping = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!opts().allowSwipeActions || !isSwiping) return;

    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
    }
    animationFrame = window.requestAnimationFrame(() => {
      currentX = e.touches[0]?.clientX || 0;
      const deltaX = currentX - startX;
      if (deltaX > 0) return;
      const absDelta = Math.abs(deltaX);

      if (!hasStartedSwiping && absDelta < SWIPE_TRIGGER_THRESHOLD) {
        return;
      }

      if (hasStartedSwiping && absDelta === 1) {
        hasStartedSwiping = false;
        return;
      }

      hasStartedSwiping = true;

      const translateX = deltaX;

      if (canEditSwipe()) {
        setSwipeAction(
          absDelta >= REPLY_THRESHOLD
            ? "reply"
            : absDelta >= EDIT_THRESHOLD
              ? "edit"
              : "none"
        );
      } else {
        setSwipeAction(absDelta >= EDIT_THRESHOLD ? "reply" : "none");
      }

      const messageItemRef = opts().messageItemRef;
      if (messageItemRef) {
        messageItemRef.style.transform = `translateX(${translateX}px)`;
        messageItemRef.style.transition = "none";
      }
    });
  };

  const handleTouchEnd = () => {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
    }
    animationFrame = window.requestAnimationFrame(() => {
      const action = swipeAction();
      setSwipeAction("none");
      const messageItemRef = opts().messageItemRef;

      if (messageItemRef) {
        messageItemRef.style.transition =
          "transform 0.2s ease-out, background-color 0.2s";
        messageItemRef.style.transform = "";

        setTimeout(() => {
          if (messageItemRef) {
            messageItemRef.style.backgroundColor = "";
          }
        }, 200);
      }

      if (action === "edit" && canEditSwipe()) {
        store.channelProperties.setEditMessage(
          opts().message.channelId,
          opts().message
        );
      } else if (action === "reply") {
        store.channelProperties.addReply(
          opts().message.channelId,
          opts().message
        );
        opts().textAreaEl?.focus();
      }

      hasStartedSwiping = true;
      isSwiping = false;
      startX = 0;
      currentX = 0;
    });
  };

  return {
    action: swipeAction,
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart
  };
};
