import useStore from "@/chat-api/store/useStore";
import { createSignal } from "solid-js";
import { t } from "@nerimity/i18lite";

export function useAddFriendModalController() {
  const { friends } = useStore();
  const [userTag, setUserTag] = createSignal("");

  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({ message: "", path: "" });
  const [success, setSuccess] = createSignal(false);

  const onSendClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError({ message: "", path: "" });
    setSuccess(false);

    const split = userTag().split(":");
    if (split.length <= 1) {
      setError({ message: t("addFriendModal.errors.missingTag"), path: "" });
      setRequestSent(false);
      return;
    }
    if (split.length >= 3) {
      setError({ message: t("addFriendModal.errors.colonInUsername"), path: "" });
      setRequestSent(false);
      return;
    }

    const username = split[0];
    const tag = split[1];

    await friends
      .sendRequest(username!, tag!)
      .then(() => {
        setSuccess(true);
      })
      .catch((err) => {
        setError({ message: err.message, path: err.path });
      });

    setRequestSent(false);
  };

  return {
    userTag,
    setUserTag,
    onSendClick,
    requestSent,
    error,
    success,
  };
}
