export const copyToClipboard = (text: string) => {
  return navigator.clipboard.writeText(text);
};
