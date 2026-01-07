export interface Font {
  id: number;
  name: string;
  import: () => Promise<{ default: typeof import("*.css") }>;
  scale: number;
  lineHeight?: number;
  letterSpacing?: number;
}
export const Fonts: Font[] = [
  {
    id: 0,
    name: "Inter",
    import: () => import("@fontsource/inter/latin-400.css"),
    scale: 1,
    lineHeight: 1.2,
  },
  {
    id: 1,
    name: "Press Start 2P",
    import: () => import("@fontsource/press-start-2p/latin-400.css"),
    scale: 0.9,
    letterSpacing: -2.1,
  },
  {
    id: 2,
    name: "Indie Flower",
    import: () => import("@fontsource/indie-flower/latin-400.css"),
    scale: 1.33,
    lineHeight: 0.9,
  },
];

export const getFont = (id: number) =>
  Fonts.find((f) => f.id === id) || Fonts[0];

export const loadAllFonts = async () => {
  for (const font of Fonts) {
    await font.import();
  }
};

loadAllFonts();
