import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import Text from "../ui/Text";
import { css, styled } from "solid-styled-components";
import {
  getCurrentLanguage,
  getLanguage,
  Language,
  languages,
  setCurrentLanguage,
} from "@/locales/languages";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";
import { useTransContext } from "@nerimity/solid-i18lite";
import { Emoji } from "../markup/Emoji";
import { emojiUnicodeToShortcode, unicodeToTwemojiUrl } from "@/emoji";
import { CustomLink } from "../ui/CustomLink";
import { Notice } from "../ui/Notice/Notice";
import { Modal } from "../ui/modal";
import { Rerun } from "@solid-primitives/keyed";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import Input from "../ui/input/Input";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import en from "@/locales/list/en-gb.json?raw";
import { t } from "@nerimity/i18lite";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
`;

export default function LanguageSettings() {
  const { header } = useStore();
  const [t, actions] = useTransContext();

  const [currentLocalLanguage, setCurrentLocalLanguage] = createSignal(
    getCurrentLanguage() || "en_gb"
  );
  const [searchTerm, setSearchTerm] = createSignal("");
  const languageKeys = Object.keys(languages);
  const [filteredLanguages, setFilteredLanguages] = createSignal(languageKeys);
  const [percentTranslated, setPercentTranslated] = createSignal(0);

  const checkTranslatedStrings = (langKey: string, lang: any) => {
    let total = 0;
    let translated = 0;

    const checkNested = (obj: any, nestedLang: any) => {
      for (const key in obj) {
        if (typeof obj[key] === "string") {
          total++;
          if (nestedLang?.[key] && nestedLang[key] !== obj[key]) translated++;
        } else if (typeof obj[key] === "object") {
          checkNested(obj[key], nestedLang?.[key]);
        }
      }
    };

    checkNested(en, lang);
    const percent = (translated / total) * 100;
    setPercentTranslated(percent);
  };

  const normalizeForSearch = (str?: string) =>
    str
      ?.normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .toLowerCase() || "";

  const filterLanguages = () => {
    const term = normalizeForSearch(searchTerm());
    return languageKeys.filter((key) => {
      const lang = (languages as any)[key] as Language;
      const name = normalizeForSearch(lang.name);
      const native = normalizeForSearch(lang.nativeName);
      return name.includes(term) || native.includes(term);
    });
  };

  createEffect(() => setFilteredLanguages(filterLanguages()));

  const setLanguage = async (key: string) => {
    const oldKey = key;
    key = key.replace("-", "_");

    document.documentElement.setAttribute("lang", oldKey || "en");

    if (key !== "en_gb") {
      const language = await getLanguage(key);
      if (!language) return;
      checkTranslatedStrings(oldKey, language);
      actions.addResources(key, "translation", language);
    } else {
      setPercentTranslated(100);
    }

    actions.changeLanguage(key);
    setCurrentLanguage(key);
    setCurrentLocalLanguage(key);
  };

  onMount(async () => {
    const currentKey = getCurrentLanguage() || "en_gb";
    const language = await getLanguage(currentKey);
    if (language) {
      checkTranslatedStrings(currentKey.replace("_", "-"), language);
    }
  });

  createEffect(() => {
    header.updateHeader({
      title: t("settings.drawer.title") + " - " + t("settings.drawer.language"),
      iconName: "settings",
    });
  });

  return (
    <Rerun on={getCurrentLanguage}>
      <Container>
        <Input
          label={t("inbox.drawer.searchBarPlaceholder")}
          value={searchTerm()}
          onText={setSearchTerm}
        />

        <Notice type="warn" description={t("settings.language.searchNotice")} />

        <For each={filteredLanguages()}>
          {(key) => (
            <LanguageCardItem
              languageKey={key}
              selected={currentLocalLanguage().replace("_", "-") === key}
              percentTranslated={percentTranslated()}
              onClick={() => setLanguage(key)}
            />
          )}
        </For>
      </Container>
    </Rerun>
  );
}

function LanguageCardItem(props: {
  languageKey: string;
  selected: boolean;
  percentTranslated?: number;
  onClick: () => void;
}) {
  const { createPortal } = useCustomPortal();
  const language = (languages as any)[props.languageKey] as Language;

  const handlePercentClick = () => {
    createPortal((close) => (
      <TranslateModal close={close} language={props.languageKey} />
    ));
  };

  return (
    <SettingsBlock
      header
      icon={
        <div
          style={{
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            height: "100%",
          }}
        >
          <Emoji
            class={css`height: 30px; width: 30px;`}
            name={emojiUnicodeToShortcode(language.emoji)}
            url={unicodeToTwemojiUrl(language.emoji)}
          />
        </div>
      }
      label={language.name}
      description={
        <FlexColumn gap="2px">
          {language.nativeName && language.nativeName !== language.name && (
            <Text size={14} opacity={0.5}>
              ({language.nativeName})
            </Text>
          )}
          <Contributors contributors={language.contributors} />
        </FlexColumn>
      }
      onClick={props.onClick}
      class={css`
        border-bottom-left-radius: 10px !important;
        border-bottom-right-radius: 10px !important;
      `}
    >
      <FlexRow align="center" justify="space-between">
        <Show when={props.percentTranslated && props.selected}>
          <Text
            size={14}
            style={{ cursor: "pointer", opacity: 0.6 }}
            onClick={handlePercentClick}
          >
            {Math.floor(props.percentTranslated || 0)}%
          </Text>
        </Show>
      </FlexRow>
    </SettingsBlock>
  );
}

const ContributorContainer = styled(FlexRow)`font-size: 14px;`;

function Contributors(props: { contributors: string[] }) {
  return (
    <FlexRow gap="5px" wrap="wrap">
      <Text size={14} style={{ "margin-right": "5px" }}>
        {t("settings.language.contributors")}:
      </Text>
      <For each={props.contributors}>
        {(contributor, i) => (
          <ContributorContainer gap={5}>
            <Show when={i() > 0}>{", "}</Show>
            <Show when={isUrl(contributor)}>
              <CustomLink
                decoration
                href={contributor}
                target="_blank"
                rel="noopener noreferrer"
              >
                {lastPath(contributor)}
              </CustomLink>
            </Show>
            <Show when={!isUrl(contributor)}>
              <Text size={14} opacity={0.8}>
                {contributor}
              </Text>
            </Show>
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
  } catch {
    return false;
  }
}

function lastPath(url: string) {
  return url.split("/").pop() || "";
}

let rawEn: Record<string, string> | null = null;
let translatedLang: Record<string, string> | null = null;

const TranslateModal = (props: { language: string; close: () => void }) => {
  let iframe: HTMLIFrameElement | undefined;

  const fetchLocaleFromGithub = async (language: string) => {
    return await fetch(
      `https://raw.githubusercontent.com/Nerimity/nerimity-web/refs/heads/main/src/locales/list/${language}.json`
    ).then((res) => res.json());
  };

  const handleIframeLoad = async () => {
    rawEn = rawEn || (await fetchLocaleFromGithub("en-gb"));
    translatedLang = await fetchLocaleFromGithub(props.language);

    iframe?.contentWindow?.postMessage(
      { default: rawEn, translated: translatedLang },
      "https://supertigerdev.github.io/i18n-tool/"
    );
  };

  return (
    <Modal.Root
      close={props.close}
      doNotCloseOnBackgroundClick
      desktopMaxWidth={860}
      class={css`width: 90vw;`}
    >
      <Modal.Header
        title={t("settings.language.translateModal.title")}
        icon="translate"
      />
      <Modal.Body class={css`height: 90vh;`}>
        <iframe
          src="https://supertigerdev.github.io/i18n-tool/"
          height="100%"
          width="100%"
          ref={iframe}
          onLoad={() => handleIframeLoad()}
          frameBorder="0"
          id="iframe"
        />
      </Modal.Body>
    </Modal.Root>
  );
};
