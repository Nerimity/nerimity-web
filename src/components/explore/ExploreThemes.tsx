import { createSignal, createMemo, For, Show, onMount, batch } from "solid-js";
import { styled, css } from "solid-styled-components";
import Button from "../ui/Button";
import Input from "../ui/input/Input";
import { t } from "@nerimity/i18lite";
import { ThemePreset, themePresets } from "@/common/themes";
import { Skeleton } from "../ui/skeleton/Skeleton";
import { FlexRow } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";
import { Notice } from "../ui/Notice/Notice";
import ThemeCard from "./ThemeCard";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

const GridLayout = styled("div")`
  display: grid;
  grid-gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
`;

const SectionTitle = styled("h3")`
  margin: 16px 0 8px 0;
  font-size: 1rem;
  font-weight: bold;
  color: var(--text-color);
`;

const GitHubButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #24292f;
  color: #ffffff;
  align-self: flex-end;
  &:hover {
    background: #3f4448;
  }
`;

export default function ExploreThemes() {
  const [themes, setThemes] = createSignal<Record<string, ThemePreset>>({});
  const [loading, setLoading] = createSignal(true);
  const { header } = useStore();
  const [search, setSearch] = createSignal("");

  const REMOTE_THEMES_URL =
    "https://raw.githubusercontent.com/Nerimity/themes/refs/heads/main/themes.json";

  onMount(() => {
    header.updateHeader({
      title: t("explore.themes.title"),
      iconName: "explore",
    });
    fetchThemes();
  });

  const fetchThemes = async () => {
    setLoading(true);
    try {
      const res = await fetch(REMOTE_THEMES_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();
      batch(() => {
        setThemes(json);
        setLoading(false);
      });
    } catch (err) {
      console.error(err);
      batch(() => {
        setThemes({});
        setLoading(false);
      });
    }
  };

  const officialThemes = () =>
    Object.entries(themePresets).filter(([name]) =>
      search() ? name.toLowerCase().includes(search().toLowerCase()) : true
    );

  const communityThemes = createMemo(() =>
    Object.entries(themes())
      .filter(([name]) => !themePresets[name] && name !== "Template")
      .filter(([name]) =>
        search() ? name.toLowerCase().includes(search().toLowerCase()) : true
      )
  );

  return (
    <Container>
      <Notice type="info">{t("explore.themes.themesHeaderDescription")}</Notice>

      <FlexRow
        style={{ "justify-content": "space-between", "margin-bottom": "10px" }}
        wrap
      >
        <Input
          label={t("general.searchPlaceholder")}
          onText={setSearch}
          value={search()}
          class={css`
            flex: 1;
            min-width: 200px;
          `}
        />
        <GitHubButton
          label="GitHub"
          iconName="code"
          margin={[0, 0, 0, 4]}
          onClick={() =>
            window.open("https://github.com/Nerimity/themes", "_blank")
          }
        />
      </FlexRow>

      <Show when={officialThemes().length}>
        <SectionTitle>{t("explore.themes.officialThemes")}</SectionTitle>
        <GridLayout>
          <For each={officialThemes()}>
            {([name, themeObj]) => (
              <ThemeCard name={name} themeObj={themeObj} explore />
            )}
          </For>
        </GridLayout>
      </Show>

      <SectionTitle>{t("explore.themes.communityThemes")}</SectionTitle>
      <GridLayout>
        <Show when={loading()}>
          <For each={Array(6).fill(null)}>
            {() => <Skeleton.Item height="200px" width="100%" />}
          </For>
        </Show>

        <Show when={!loading() && communityThemes().length > 0}>
          <For each={communityThemes()}>
            {([name, themeObj]) => (
              <ThemeCard name={name} themeObj={themeObj} explore />
            )}
          </For>
        </Show>

        <Show when={!loading() && communityThemes().length === 0}>
          <div>{t("explore.themes.noCommunityThemes")}</div>
        </Show>
      </GridLayout>
    </Container>
  );
}
