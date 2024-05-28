import Input from "@/components/ui/input/Input";
import { loginRequest } from "../chat-api/services/UserService";
import Button from "@/components/ui/Button";
import { getStorageString, setStorageString, StorageKeys } from "../common/localStorage";
import { A, useNavigate, useLocation } from "solid-navigator";
import { createSignal, onMount } from "solid-js";
import PageHeader from "../components/PageHeader";
import { css, styled  } from "solid-styled-components";
import { FlexColumn } from "@/components/ui/Flexbox";
import { useTransContext } from "@mbarzda/solid-i18next";
import PageFooter from "@/components/PageFooter";

const LoginPageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const Content = styled(FlexColumn)`
  background: var(--pane-color);
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

const Title = styled("div")`
  color: var(--primary-color);
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 30px;
`;

const linkStyle = css`
  margin-top: 20px;
  display: block;
  text-align: center;
`;

export default function LoginPage() {
  const [t] = useTransContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({message: "", path: ""});
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  
  onMount(() => {
    if (getStorageString(StorageKeys.USER_TOKEN, null)) {
      navigate("/app", {replace: true});
    }
  });

  const loginClicked = async (event?: SubmitEvent | MouseEvent) => {
    event?.preventDefault();
    const redirectTo = location.query.redirect || "/app";
    if (requestSent()) return;
    setRequestSent(true);
    setError({message: "", path: ""});
    const response = await loginRequest(email().trim(), password().trim()).catch(err => {
      setError({message: err.message, path: err.path});
    });
    setRequestSent(false);
    if (!response) return;
    setStorageString(StorageKeys.USER_TOKEN, response.token);
    navigate(redirectTo);
  };

  return (
    <LoginPageContainer class="login-page-container">
      <PageHeader />
      <Content>
        <Container class='container'>
          <form style={{display: "flex", "flex-direction": "column"}} action='#' onSubmit={loginClicked}>
            <Title>{t("loginPage.title")}</Title>
            <Input margin={[10, 0, 10, 0]} label={t("loginPage.emailOrUsernameAndTag")} errorName={["email", "usernameAndTag"]}  type='text' error={error()} onText={setEmail} />
            <Input margin={[10, 0, 10, 0]} label={t("loginPage.password")} type='password' error={error()} onText={setPassword} />
            <Button primary styles={{flex: 1}} margin={[10,0,0,0]}  iconName='login' label={requestSent() ? t("loginPage.loggingIn") : t("loginPage.loginButton")} onClick={loginClicked} />
          </form>
          <A class={linkStyle} href="/reset-password">Reset Password</A>
          <A class={linkStyle} href="/register">{t("loginPage.createAccountInstead")}</A>
        </Container>
      </Content>
      <PageFooter/>
    </LoginPageContainer>
  );
}