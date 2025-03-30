import env from "./env";

export const inviteLinkRegex = new RegExp(`${env.APP_URL}/i/([\\S]+)`);

export const youtubeLinkRegex =
  /(youtu.*be.*)\/(watch\?v=|embed\/|v|shorts|)(.*?((?=[&#?])|$))/;

export const twitterStatusLinkRegex =
  /https:\/\/(www.)?(twitter|x)\.com(\/[a-zA-Z0-9_]+\/status\/[0-9]+)/;
