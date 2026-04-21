import env from "./env";

export const generateUrl = (
  item: undefined | { avatar?: string; banner?: string },
  type: "avatar" | "banner"
): string | null => (item?.[type] ? env.NERIMITY_CDN + item?.[type] : null);
