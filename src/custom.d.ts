declare module "chroma-js/src/generator/average.js" {
  import { Color, InterpolationMode } from "chroma-js";
  export default function average(
    colors: Array<string | Color>,
    colorSpace?: InterpolationMode,
    weights?: number[],
  ): Color;
}

interface Window {
  twttr?: {
    widgets: {
      load: (element?: HTMLElement) => void;
    };
  };
}
