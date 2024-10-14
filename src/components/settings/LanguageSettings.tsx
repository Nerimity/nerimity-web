import { createEffect, createSignal, For, Show } from "solid-js";
import Text from "@/components/ui/Text";
import { css, styled } from "solid-styled-components";
import { getCurrentLanguage, getLanguage, Language, languages, setCurrentLanguage } from "@/locales/languages";

import ItemContainer from "../ui/Item";
import twemoji from "twemoji";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";
import { useTransContext } from "@mbarzda/solid-i18next";
import env from "@/common/env";
import { emojiUnicodeToShortcode, unicodeToTwemojiUrl } from "@/emoji";
import { Emoji } from "../markup/Emoji";
import { CustomLink } from "../ui/CustomLink";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

const LanguageItemContainer = styled(ItemContainer)`
  padding: 5px;
  gap: 10px;
  padding-left: 10px;
  &:hover {
    box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.4);
  }
`;

export default function LanguageSettings() {
  const { header } = useStore();
  const [, actions] = useTransContext();

  const [currentLocalLanguage, setCurrentLocalLanguage] = createSignal(getCurrentLanguage() || "en_gb");

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Language",
      iconName: "settings"
    });
  });

  const languageKeys = Object.keys(languages);



  const setLanguage = async (key: string) => {
    key = key.replace("-", "_");
    if (key !== "en_gb") {
      const language = await getLanguage(key);
      if (!language) return;
      actions.addResources(key, "translation", language);
    }
    actions.changeLanguage(key);
    setCurrentLanguage(key);
    setCurrentLocalLanguage(key);
  };


  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.language")} />
      </Breadcrumb>
      <For each={languageKeys}>
        {key => <LanguageItem selected={currentLocalLanguage().replace("_", "-") === key} onClick={() => setLanguage(key)} key={key} />}
      </For>
    </Container>
  );
}

function LanguageItem(props: { key: string, selected: boolean, onClick: () => void }) {
  const language = (languages as any)[props.key] as Language;

  const onClick = (event: any) => {
    const target = event.target as HTMLElement;
    if (target.tagName === "A") return;
    props.onClick();
  };

  return (
    <LanguageItemContainer onclick={onClick} selected={props.selected}>
      <Emoji class={css`height: 30px; width: 30px;`} name={emojiUnicodeToShortcode(language.emoji)} url={unicodeToTwemojiUrl(language.emoji)} />
      <FlexColumn>
        <Text>{language.name}</Text>
        <Contributors contributors={language.contributors} />
      </FlexColumn>
    </LanguageItemContainer>
  );
}

const ContributorContainer = styled(FlexRow)`
  font-size: 14px;
`;

function Contributors(props: { contributors: string[] }) {
  return (
    <FlexRow>
      <Text size={14} style={{ "margin-right": "5px" }}>Contributors:</Text>
      <For each={props.contributors}>
        {(contributor, i) => (
          <ContributorContainer gap={5}>
            <Show when={i() > 0}>{", "}</Show>
            <Show when={isUrl(contributor)}><CustomLink decoration href={contributor} target="_blank" rel="noopener noreferrer">{lastPath(contributor)}</CustomLink></Show>
            <Show when={!isUrl(contributor)}><Text size={14} opacity={0.8}>{contributor}</Text></Show>
          </ContributorContainer>
        )}
      </For>
    </FlexRow>
  );
}

function isUrl(url: string) {
  try {
    new URL(url);
    return true;
  }
  catch (e) {
    return false;
  }
}

function lastPath(url: string) {
  const split = url.split("/");
  return split[split.length - 1];
}