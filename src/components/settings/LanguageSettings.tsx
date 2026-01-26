import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import Text from "@/components/ui/Text";
import { css, styled } from "solid-styled-components";
import {
  getCurrentLanguage,
  getLanguage,
  Language,
  languages,
  setCurrentLanguage,
} from "@/locales/languages";

import ItemContainer from "../ui/LegacyItem";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";
import { useTransContext } from "@nerimity/solid-i18lite";
import { emojiUnicodeToShortcode, unicodeToTwemojiUrl } from "@/emoji";
import { Emoji } from "../markup/Emoji";
import { CustomLink } from "../ui/CustomLink";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { Notice } from "../ui/Notice/Notice";
import Button from "../ui/Button";
import en from "@/locales/list/en-gb.json?raw";
import { Modal } from "../ui/modal";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { Rerun } from "@solid-primitives/keyed";
import Input from "../ui/input/Input";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

const LanguageItemContainer = styled(ItemContainer)`
  padding: 8px;
  gap: 10px;
  padding-left: 10px;
  background-color: rgba(255, 255, 255, 0.04);
  &:hover {
    box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.4);
  }
  &:after {
    display: none;
  }
`;

export default function LanguageSettings() {
  const [t] = useTransContext();
  const { header } = useStore();
  const [, actions] = useTransContext();
  const [search, setSearch] = createSignal("");

  const [currentLocalLanguage, setCurrentLocalLanguage] = createSignal(
    getCurrentLanguage() || "en_gb",
  );

  const [percentTranslated, setPercentTranslated] = createSignal(0);

  const checkTranslatedStrings = (langKey: string, lang: any) => {
    let total = 0;
    let translated = 0;
    const checkNested = (obj: any, nestedLang: any) => {
      for (const key in obj) {
        if (typeof obj[key] === "string") {
          total++;
          if (nestedLang?.[key] && nestedLang?.[key] !== obj) translated++;
        } else if (typeof obj[key] === "object") {
          checkNested(obj[key], nestedLang?.[key]);
        }
      }
    };

    checkNested(en, lang);
    const percent = (translated / total) * 100;
    setPercentTranslated(percent);
  };

  onMount(async () => {
    const currentKey = getCurrentLanguage() || "en_gb";
    const language = await getLanguage(currentKey);
    checkTranslatedStrings(currentKey.replace("_", "-"), language);
  });

  createEffect(() => {
    header.updateHeader({
      title: t("settings.drawer.title") + " - " + t("settings.drawer.language"),
      iconName: "settings",
    });
  });

  const languageKeys = Object.keys(languages);

  const normalizeForSearch = (str?: string) =>
    str
      ?.normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .toLowerCase() || "";

  const filterLanguages = () => {
    const term = normalizeForSearch(search());
    if (!term.trim()) return languageKeys;
    return languageKeys.filter((key) => {
      const lang = (languages as any)[key] as Language;
      const name = normalizeForSearch(lang.name);
      const native = normalizeForSearch(lang.nativeName);
      return name.includes(term) || native.includes(term);
    });
  };

  const setLanguage = async (key: string) => {
    const oldKey = key;
    key = key.replace("-", "_");

    // Set language attribute without changing layout direction
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

  return (
    <Rerun on={getCurrentLanguage}>
      <Container>
        <Breadcrumb>
          <BreadcrumbItem
            href="/app"
            icon="home"
            title={t("dashboard.title")}
          />
          <BreadcrumbItem title={t("settings.drawer.language")} />
        </Breadcrumb>

        <Input
          label={t("inbox.drawer.searchBarPlaceholder")}
          value={search()}
          onText={setSearch}
        />

        <Notice type="warn" description={t("settings.language.searchNotice")} />

        <FlexColumn
          gap={8}
          class={css`
            margin-top: 8px;
          `}
        >
          <For each={filterLanguages()}>
            {(key) => (
              <LanguageItem
                selected={currentLocalLanguage().replace("_", "-") === key}
                onClick={() => setLanguage(key)}
                key={key}
                percentTranslated={percentTranslated()}
              />
            )}
          </For>
        </FlexColumn>
      </Container>
    </Rerun>
  );
}

function LanguageItem(props: {
  key: string;
  selected: boolean;
  onClick: () => void;
  percentTranslated?: number;
}) {
  const { createPortal } = useCustomPortal();
  const language = (languages as any)[props.key] as Language;

  const onClick = (event: any) => {
    const target = event.target as HTMLElement;
    if (target.tagName === "A") return;
    props.onClick();
  };

  const handlePercentClick = async () => {
    window.open(
      "https://hosted.weblate.org/projects/nerimity/-/" + props.key,
      "_blank",
    );
    // createPortal((close) => (
    //   <TranslateModal close={close} language={props.key} />
    // ));
  };

  return (
    <LanguageItemContainer
      onclick={onClick}
      selected={props.selected}
      handlePosition="right"
    >
      <Emoji
        class={css`
          height: 30px;
          width: 30px;
          align-self: flex-start;
        `}
        name={emojiUnicodeToShortcode(language.emoji)}
        url={unicodeToTwemojiUrl(language.emoji)}
      />
      <FlexColumn gap={2}>
        <Text>{language.name}</Text>
        <Show
          when={language.nativeName && language.nativeName !== language.name}
        >
          <Text opacity={0.6} size={14}>
            {language.nativeName}
          </Text>
        </Show>
        <Contributors contributors={language.contributors} />
      </FlexColumn>

      <Show when={props.percentTranslated && props.selected}>
        <div
          class={css`
            margin-left: auto;
            opacity: 0.6;
            cursor: pointer;
            transition: 0.2s;
            font-size: 14px;
            &:hover {
              opacity: 1;
            }
          `}
          onClick={handlePercentClick}
        >
          {Math.floor(props.percentTranslated || 0)}%
        </div>
      </Show>
    </LanguageItemContainer>
  );
}

const ContributorContainer = styled(FlexRow)`
  font-size: 14px;
`;

function Contributors(props: { contributors: string[] }) {
  const [t] = useTransContext();
  return (
    <FlexRow>
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
  } catch (e) {
    return false;
  }
}

function lastPath(url: string) {
  const split = url.split("/");
  return split[split.length - 1];
}

// let rawEn: Record<string, string> | null = null;
// let translatedLang: Record<string, string> | null = null;

// const TranslateModal = (props: { language: string; close: () => void }) => {
//   let iframe: HTMLIFrameElement | undefined;

//   const fetchLocaleFromGithub = async (language: string) => {
//     return await fetch(
//       `https://raw.githubusercontent.com/Nerimity/nerimity-web/refs/heads/main/src/locales/list/${language}.json`,
//     ).then((res) => res.json());
//   };

//   const handleIframeLoad = async () => {
//     rawEn = rawEn || (await fetchLocaleFromGithub("en-gb"));
//     translatedLang = await fetchLocaleFromGithub(props.language);

//     iframe?.contentWindow?.postMessage(
//       { default: rawEn, translated: translatedLang },
//       "https://supertigerdev.github.io/i18n-tool/",
//     );
//   };

//   return (
//     <Modal.Root
//       close={props.close}
//       doNotCloseOnBackgroundClick
//       desktopMaxWidth={860}
//       class={css`
//         width: 90vw;
//       `}
//     >
//       <Modal.Header
//         title={tt("settings.language.translateModal.title")}
//         icon="translate"
//       />
//       <Modal.Body
//         class={css`
//           height: 90vh;
//         `}
//       >
//         <iframe
//           src="https://supertigerdev.github.io/i18n-tool/"
//           height="100%"
//           width="100%"
//           ref={iframe}
//           onLoad={() => handleIframeLoad()}
//           frameBorder="0"
//           id="iframe"
//         />
//       </Modal.Body>
//     </Modal.Root>
//   );
// };
