import env from "@/common/env";
import Button from "@/components/ui/Button";
import { useNavigate } from "solid-navigator";
import PageHeader from "../components/PageHeader";
import { styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { appLogoUrl } from "@/common/worldEvents";
import { useTransContext } from "@mbarzda/solid-i18next";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import Icon from "@/components/ui/icon/Icon";
import { CustomLink } from "@/components/ui/CustomLink";
import PageFooter from "@/components/PageFooter";

const HomePageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  background-color: #7C2121; /* Updated background color */
`;

const Content = styled("div")`
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--pane-color);
  margin: 8px;
  margin-top: 0;
  margin-bottom: 0;
  border-radius: 8px;
  flex: 1;
`;

const ArtImage = styled("img")`
  position: absolute;
  bottom: 0;
  right: 0;
  width: auto;
  height: 100%;
  opacity: 0.02;
  pointer-events: none;
  @media (orientation: portrait) {
    width: 100%;
    height: auto;
  }
`;

const TopContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 490px;
  flex-shrink: 0;
  background-color: #EF9F12; /* Updated banner color */
`;

const ButtonsContainer = styled("div")`
  margin-top: 10px;
  display: flex;
  margin-left: -5px;

  a {
    text-decoration: none;
    div {
      width: 130px;
    }
  }
`;

const Logo = styled("img")`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(34px);
`;

export default function () {
  const [t] = useTransContext();
  
  const releaseLink = `https://github.com/Nerimity/nerimity-web/releases/${env.APP_VERSION ? `tag/${env.APP_VERSION}` : ""}`;

  return (

<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ADS-Chat</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        body {
            font-family: "Times New Roman", Times, serif;
        }
        .banner {
            width: 100%;
            background-color: #F9B006; /* Canary yellow */
            color: white;
            padding: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1000;
        }
        .banner .name {
            font-size: 24px;
            font-weight: bold;
        }
        .banner .top-buttons {
            display: flex;
            gap: 10px;
            margin-right: 20px; /* Adjust this value to move buttons further left */
        }
        .banner .top-buttons button {
            background-color: white;
            color: #F9B006; /* Canary yellow */
            border: none;
            padding: 10px 20px;
            cursor: pointer;
        }
        .container {
            margin-top: 60px; /* Adjust this value based on the height of your banner */
        }
    </style>
</head>
<body>
    <div class="banner">
        <div class="name">ADS-Chat</div>
        <div class="top-buttons">
            <button onclick="window.location.href='https://example-login.com'">Login</button>
            <button onclick="window.location.href='https://example-signup.com'">Sign Up</button>
        </div>
    </div>
    <div class="container">
        <div class="logo">
            <!-- Placeholder for logo -->
            <img src="logo.png" alt="ADS-Chat Logo">
        </div>
        <h1>Welcome to ADS-Chat</h1>
        <div class="buttons">
            <button class="btn login-btn" onclick="window.location.href='login.html'">Login</button>
            <button class="btn register-btn" onclick="window.location.href='register.html'">Register</button>
            <button class="btn download-btn" onclick="window.location.href='https://download.quizzity.tech/'">Downloads</button>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>

  );
}

const PlatformDownloadLinks = () => {
  const navigate = useNavigate();
  return (
    <FlexColumn gap={10} itemsCenter style={{"margin-top": "10px"}}>
      <Text size={16} opacity={0.7}>Available on</Text>
      <FlexRow wrap justifyCenter>
        <Button onClick={() => navigate("/register")} color='' label='Browser' iconName='public' primary />
        <Button onClick={() => window.open("https://github.com/Nerimity/nerimity-desktop/releases/latest", "_blank")} color='' label='Windows' iconName='grid_view' primary />
        <Button onClick={() => window.open("https://github.com/Nerimity/NerimityReactNative/releases/latest", "_blank")} color='#31a952' customChildren={
          <FlexRow itemsCenter>
            <Text>Android</Text>
            <Text opacity={0.8} size={12}>(Experimental)</Text>
          </FlexRow>
        } iconName='android' primary />
      </FlexRow>  
    </FlexColumn>
  );
};

const FeatureListContainer = styled("div")`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  max-width: 800px;
  gap: 10px;
  column-gap: 20px;
  align-self: center;
  margin-top: 100px;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 8px;
  backdrop-filter: blur(34px);
  z-index: 1111;
  margin: 10px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

function FeatureList() {
  return (
    <FeatureListContainer>
      <Feature icon='gif' label='Free animated avatars & emojis'/>
      <Feature icon='preview' label='Sleek design'/>
      <Feature icon='sell' label='Change your tag for free'/>
      <Feature icon='add' label='Create posts on your profile'/>
      <Feature icon='dns' label='Create your own community'/>
      <Feature icon='explore' label='Find new communities'/>
      <Feature icon='volunteer_activism' label='Runs from donations'/>
      <Feature icon='code' label='Full source code on GitHub'/>
    </FeatureListContainer>
  );
}

const FeatureContainer = styled(FlexRow)`
  align-items: center;
`;

function Feature(props: {icon: string, label: string;}) {
  return (
    <FeatureContainer gap={10}>
      <Icon style={{background: "rgba(255,255,255,0.05)", padding: "10px", "border-radius": "50%"}} name={props.icon} size={26} />
      <Text style={{"font-weight": "bold"}} size={14} opacity={0.8}>{props.label}</Text>
    </FeatureContainer>
  );
}
