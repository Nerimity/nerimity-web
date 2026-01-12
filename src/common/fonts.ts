export interface Font {
  id: number;
  name: string;
  import: () => Promise<{ default: typeof import("*.css") }>;
  scale: number;
  lineHeight?: number;
  letterSpacing?: string;
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
    name: "Pixelify Sans",
    import: () => import("@fontsource/pixelify-sans/latin-400.css"),
    scale: 1,
  },
  {
    id: 2,
    name: "Indie Flower",
    import: () => import("@fontsource/indie-flower/latin-400.css"),
    scale: 1.33,
    lineHeight: 0.9,
  },
  {
    id: 3,
    name: "IBM Plex Mono",
    import: () => import("@fontsource/ibm-plex-mono/latin-400.css"),
    scale: 0.9,
  },
  {
    id: 4,
    name: "Dancing Script",
    import: () => import("@fontsource/dancing-script/latin-400.css"),
    scale: 1,
  },
  {
    id: 5,
    name: "Mochiy Pop One",
    import: () => import("@fontsource/mochiy-pop-one/latin-400.css"),
    scale: 0.8,
  },
  {
    id: 6,
    name: "Grandstander",
    import: () => import("@fontsource/grandstander/latin-400.css"),
    scale: 1.2,
  },
  {
    id: 7,
    name: "Sora",
    import: () => import("@fontsource/sora/latin-400.css"),
    scale: 0.9,
  },
  {
    id: 8,
    name: "Roboto Slab",
    import: () => import("@fontsource/roboto-slab/latin-400.css"),
    scale: 0.9,
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
