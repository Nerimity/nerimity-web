const LogType = {
  WebSocket: {
    prefix: "WebSocket",
    color: "color: #4F46E5;"
  },
  RTC: {
    prefix: "WebRTC",
    color: "color: #059669;"
  },
  UPDATER: {
    prefix: "Updater",
    color: "color: #D97706;"
  }
} as const;

export const log = (type: keyof typeof LogType, ...args: unknown[]) => {
  const logType = LogType[type];
  if (!logType) return;
  console.log(`%c[${logType.prefix}]`, logType.color, ...args);
};
