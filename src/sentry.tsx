import * as Sentry from "@sentry/solid";

const showCrashPopup = (message: string) => {
  const existingDiv = document.getElementById("crash-reporter-popup");
  const div = existingDiv || document.createElement("div");
  div.id = "crash-reporter-popup";
  div.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: black;
          color: #fab1a0;
          padding: 20px;
          border-radius: 12px;
          z-index: 999999;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          max-width: 400px;
          width: 90%;
          border-left: 5px solid #ff7675;
          border: solid 1px rgba(255,255,255,0.4);
        `;

  div.innerHTML = `
          <div style="font-weight: bold; font-size: 18px; margin-bottom: 10px; color: #ff7675;">
            ⚠️ Nerimity Has Crashed
          </div>
          <div style="font-size: 14px; color: #dfe6e9; line-height: 1.4; margin-bottom: 20px; word-break: break-word;">
            ${message}
            <div style="margin-top: 10px;opacity: 0.8">See the console for more details. <code style="color: #ff7675; font-size: 12px">(CTRL + SHIFT + I)</code></div>
          </div>
          <div style="display: flex; gap: 10px;">
            <button id="crash-reload" style="flex: 1; background: var(--alert-color); color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold;">
              Reload Page
            </button>
            <button id="crash-close" style="flex: 1; background: #1a1a1a; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer;">
              Dismiss
            </button>
          </div>
        `;

  if (!existingDiv) {
    document.body.appendChild(div);
  }
  document.getElementById("crash-reload")!.onclick = () => {
    window.location.reload();
  };

  document.getElementById("crash-close")!.onclick = () => {
    div.remove();
  };
};

Sentry.init({
  dsn: "https://0@nerimity.com/0",
  async beforeSend(event) {
    const exception = event.exception?.values?.[0];
    const msg = exception?.value || "Unknown Error";
    const frame = exception?.stacktrace?.frames?.slice().reverse()[0];

    if (msg.startsWith("NotAllowedError")) return null;
    if (msg.startsWith("AbortError")) return null;
    if (msg.startsWith("Object captured as promise rejection")) return null;
    if (msg.startsWith("ResizeObserver loop limit exceeded")) return null;

    if (frame) {
      try {
        const { TraceMap, originalPositionFor } = await import(
          "@jridgewell/trace-mapping"
        );
        const res = await fetch(`${frame.filename}.map`);
        const tracer = new TraceMap(await res.json());
        const orig = originalPositionFor(tracer, {
          line: frame.lineno!,
          column: frame.colno!,
        });

        if (orig.source) {
          showCrashPopup(
            `${msg}<br/>${orig.source}:${orig.line}:${orig.column}`
          );
          return null;
        }
      } catch {
        //
      }
    }

    showCrashPopup(`${msg}`);
    return null;
  },
});
