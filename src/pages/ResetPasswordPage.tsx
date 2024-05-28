import Input from "@/components/ui/input/Input";
import { resetPassword, sendResetPassword } from "../chat-api/services/UserService";
import Button from "@/components/ui/Button";
import { A, useLocation, useNavigate, useSearchParams } from "solid-navigator";
import { Show, createSignal } from "solid-js";
import PageHeader from "../components/PageHeader";
import { css, styled  } from "solid-styled-components";
import { FlexColumn } from "@/components/ui/Flexbox";
import { useTransContext } from "@mbarzda/solid-i18next";
import PageFooter from "@/components/PageFooter";
import Text from "@/components/ui/Text";
import { StorageKeys, setStorageString } from "@/common/localStorage";

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

export default function ResetPasswordPage() {
  const [t] = useTransContext();
  const location = useLocation();

  const navigate = useNavigate();
  const [error, setError] = createSignal({message: "", path: ""});
  const [requestSent, setRequestSent] = createSignal(false);
  const [success, setSuccess] = createSignal("");

  const [newPassword, setNewPassword] = createSignal("");
  const [confirmNewPassword, setConfirmNewPassword] = createSignal("");


  const [params] = useSearchParams<{userId?: string, code?: string}>();

  const resetPasswordClicked = async (event: SubmitEvent | MouseEvent) => {
    event?.preventDefault();

    const redirectTo = location.query.redirect || "/app";


    if (requestSent()) return;
    setRequestSent(true);
    setSuccess("");
    setError({message: "", path: ""});

    if (newPassword() !== confirmNewPassword()) {
      setError({message: "Confirm password does not match.", path: "Confirm Password"});
      setRequestSent(false);
      return;
    }

    const res = await resetPassword(params.code!, params.userId!, newPassword()).catch(err => {
      setError({message: err.message, path: err.path});
      setRequestSent(false);
    });

    if (res && res.token) {
      setSuccess("Password reset successful.");
      setTimeout(() => {
        setStorageString(StorageKeys.USER_TOKEN, res.token);
        navigate(redirectTo);

      }, 2000);
    }


  };

  return (
    <>
      <Show when={params.userId && params.code} fallback={<SendCodePage />}>
        <LoginPageContainer class="login-page-container">
          <PageHeader />
          <Content>
            <Container class='container'>
              <form style={{display: "flex", "flex-direction": "column"}} action='#' onSubmit={resetPasswordClicked}>
                <Title>Reset Password</Title>
                <Input margin={[10, 0, 10, 0]} label="New Password" type='password' onText={setNewPassword} />
                <Input margin={[10, 0, 10, 0]} label="Confirm New Password" type='password' onText={setConfirmNewPassword} />
                <Text size={14} color="var(--alert-color)">{error().message}</Text>
                <Text size={14} color="var(--success-color)">{success()}</Text>
                <Button primary styles={{flex: 1}} margin={[10,0,0,0]}  iconName='key' label={requestSent() ? "Resetting...": "Reset Password"} onClick={resetPasswordClicked} />
              </form>
            </Container>
          </Content>
          <PageFooter/>
        </LoginPageContainer>
      </Show>
    </>
  );


}

const SendCodePage = () => {
  const [t] = useTransContext();

  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({message: "", path: ""});
  const [email, setEmail] = createSignal("");
  const [success, setSuccess] = createSignal("");
  


  const resetPasswordClicked = async (event?: SubmitEvent | MouseEvent) => {
    event?.preventDefault();
    if (requestSent()) return;
    setRequestSent(true);
    setSuccess("");
    setError({message: "", path: ""});
    const res = await sendResetPassword(email().trim()).catch(err => {
      setError({message: err.message, path: err.path});
    });
    if (res) {
      setSuccess(res.message);
    }
    setRequestSent(false);


  };

  return (
    <LoginPageContainer class="login-page-container">
      <PageHeader />
      <Content>
        <Container class='container'>
          <form style={{display: "flex", "flex-direction": "column"}} action='#' onSubmit={resetPasswordClicked}>
            <Title>Reset Password</Title>
            <Input margin={[10, 0, 10, 0]} label="Email" type='text' onText={setEmail} />
            <Text size={14} color="var(--alert-color)">{error().message}</Text>
            <Text size={14} color="var(--success-color)">{success()}</Text>
            <Button primary styles={{flex: 1}} margin={[10,0,0,0]}  iconName='mail' label={requestSent() ? "Sending Email...": "Send Email"} onClick={resetPasswordClicked} />
          </form>
          <A class={linkStyle} href="/login">{t("registerPage.loginInstead")}</A>
        </Container>
      </Content>
      <PageFooter/>
    </LoginPageContainer>
  );
};