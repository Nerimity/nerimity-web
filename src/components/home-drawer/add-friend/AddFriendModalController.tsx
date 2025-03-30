import useStore from "@/chat-api/store/useStore";
import { useTransContext } from "@mbarzda/solid-i18next";
import { createSignal } from "solid-js";

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

    const [t] = useTransContext();

    const split = userTag().split(":");
    if (split.length <= 1) {
      setError({ message: t("inbox.drawer.addFriend.usernameNotRight"), path: "" });
      setRequestSent(false);
      return;
    }
    if (split.length >= 3) {
      setError({ message: t("inbox.drawer.addFriend.usernameColon"), path: "" });
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
