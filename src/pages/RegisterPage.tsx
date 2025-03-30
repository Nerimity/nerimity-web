import Input from "@/components/ui/input/Input";
import { registerRequest } from "../chat-api/services/UserService";
import Button from "@/components/ui/Button";
import {
  getStorageString,
  setStorageString,
  StorageKeys,
} from "../common/localStorage";
import { A, useNavigate, useLocation } from "solid-navigator";
import { createSignal, onMount, Show, For } from "solid-js";
import env from "../common/env";
import PageHeader from "../components/PageHeader";
import { css, styled } from "solid-styled-components";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import { useTransContext } from "@mbarzda/solid-i18next";
import { Turnstile, TurnstileRef } from "@nerimity/solid-turnstile";
import Text from "@/components/ui/Text";
import PageFooter from "@/components/PageFooter";
import Icon from "@/components/ui/icon/Icon";
import { Title } from "@solidjs/meta";
import { MetaTitle } from "@/common/MetaTitle";

const RegisterPageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

const Content = styled(FlexColumn)`
  height: 100%;
  border-radius: 8px;
  margin: 8px;
  margin-top: 0;
  margin-bottom: 0;
  overflow: auto;
  flex: 1;
`;

const Container = styled(FlexColumn)`
  width: 300px;
  margin: auto;
  padding: 10px;
`;

const TitleContainer = styled("div")`
  color: var(--primary-color);
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const linkStyle = css`
  margin-top: 20px;
  display: block;
  text-align: center;
`;

const NoticesContainer = styled(FlexColumn)`
  background-color: var(--pane-color);
  border: solid 1px rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 6px;
`;

export default function RegisterPage() {
  const [t] = useTransContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({ message: "", path: "" });
  const [email, setEmail] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
  let verifyToken = "";
  let turnstileRef: TurnstileRef | undefined;

  onMount(() => {
    if (getStorageString(StorageKeys.USER_TOKEN, null)) {
      navigate("/app", { replace: true });
    }
  });

  const registerClicked = async (event?: SubmitEvent | MouseEvent) => {
    event?.preventDefault();
    const redirectTo = location.query.redirect || "/app";
    if (requestSent()) return;
    setRequestSent(true);
    setError({ message: "", path: "" });

    if (password() !== confirmPassword()) {
      setError({
        message: "Confirm password does not match.",
        path: "Confirm Password",
      });
      setRequestSent(false);
      return;
    }

    if (password().length > 72) {
      setError({
        message: "Password must be less than 72 characters.",
        path: "Password",
      });
      setRequestSent(false);
      return;
    }
    const response = await registerRequest(
      email(),
      username().trim(),
      password().trim(),
      verifyToken
    ).catch((err) => {
      setError({ message: err.message, path: err.path });
      turnstileRef?.reset();
    });
    setRequestSent(false);
    if (!response) return;
    setStorageString(StorageKeys.USER_TOKEN, response.token);
    setStorageString(StorageKeys.FIRST_TIME, "true");
    navigate(redirectTo);
  };

  const notices = [
    t("registerPage.notices.toxicity"),
    t("registerPage.notices.nsfw"),
    t("registerPage.notices.age"),
  ];

  return (
    <RegisterPageContainer class="register-page-container">
      <MetaTitle>Register</MetaTitle>
      <PageHeader />
      <Content>
        <Container>
          <form
            style={{ display: "flex", "flex-direction": "column" }}
            action="#"
            onSubmit={registerClicked}
          >
            <TitleContainer>
              {t("registerPage.title", { appName: "Nerimity" })}
            </TitleContainer>
            <NoticesContainer gap={5}>
              <span style={{ "margin-bottom": "6px" }}>
                <Icon
                  name="info"
                  color="var(--warn-color)"
                  style={{ "vertical-align": "middle", "margin-top": "-2px" }}
                  size={18}
                />{" "}
                <Text
                  style={{ "font-weight": "bold" }}
                  color="var(--warn-color)"
                >
                  {t("registerPage.notices.title")}
                </Text>
              </span>

              <For each={notices}>
                {(notice) => (
                  <Text
                    color="rgba(255, 255, 255, 0.8)"
                    style={{ display: "flex", gap: "5px" }}
                    size={14}
                  >
                    <div
                      style={{ "margin-top": "-4px", "font-size": "20px" }}
                      color="var(--warn-color)"
                    >
                      •
                    </div>{" "}
                    {notice}
                  </Text>
                )}
              </For>
            </NoticesContainer>
            <Input
              margin={[10, 0, 10, 0]}
              label={t("registerPage.email")}
              type="email"
              error={error()}
              onText={setEmail}
            />
            <Input
              margin={[10, 0, 10, 0]}
              label={t("registerPage.username")}
              error={error()}
              onText={setUsername}
            />
            <Input
              margin={[10, 0, 10, 0]}
              label={t("registerPage.password")}
              type="password"
              error={error()}
              onText={setPassword}
            />
            <Input
              margin={[10, 0, 10, 0]}
              label={t("registerPage.confirmPassword")}
              type="password"
              error={error()}
              onText={setConfirmPassword}
            />
            <Turnstile
              ref={turnstileRef}
              sitekey={env.TURNSTILE_SITEKEY}
              onVerify={(token) => (verifyToken = token)}
              autoResetOnExpire={true}
            />
            <Show
              when={
                !error().path ||
                error().path === "other" ||
                error().path === "token"
              }
            >
              <Text size={16} color="var(--alert-color)">
                {error().message}
              </Text>
            </Show>
            <Text style={{ "margin-top": "10px" }} size={12} opacity={0.8}>
              {t("registerPage.tosNotice")}
            </Text>
            <Button
              primary
              styles={{ flex: 1 }}
              margin={[10, 0, 0, 0]}
              iconName="login"
              label={
                requestSent()
                  ? t("registerPage.registering")
                  : t("registerPage.registerButton")
              }
              onClick={registerClicked}
            />
          </form>
          <A class={linkStyle} href="/login">
            {t("registerPage.loginInstead")}
          </A>
        </Container>
      </Content>
      <PageFooter />
    </RegisterPageContainer>
  );
}
