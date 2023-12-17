import { JSXElement, Match, Show, Switch } from "solid-js";
import styles from "./AdminBorderSvg.module.css";

export function AdminBorderSvg(props: {
  children?: JSXElement;
  color?: string;
  url?: string;
  hovered?: boolean;
}) {
  return (
    <div
      class={styles.container}
      classList={{ [styles.hovered]: props.hovered }}
    >
      <svg
        version="1.2"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 500 362"
        style={{ scale: 1.8 }}
      >
        <defs>
          <radialGradient
            id="admin-badge-g1"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(101.491,0,0,101.491,90.169,73.171)"
          >
            <stop offset="0" stop-color="#e600dd" />
            <stop offset=".781" stop-color="#5900cc" />
            <stop offset="1" stop-color="#335bcc" />
          </radialGradient>
          <radialGradient
            id="admin-badge-g2"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(106.678,0,0,106.678,66.775,171.115)"
          >
            <stop offset="0" stop-color="#ffb81f" />
            <stop offset=".6" stop-color="#db00d3" />
            <stop offset="1" stop-color="#5900cc" />
          </radialGradient>
          <radialGradient
            id="admin-badge-g3"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(119.223,0,0,119.223,37.058,138.629)"
          >
            <stop offset="0" stop-color="#ffb81f" />
            <stop offset=".6" stop-color="#db00d3" />
            <stop offset="1" stop-color="#5900cc" />
          </radialGradient>
          <radialGradient
            id="admin-badge-g4"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(124.762,0,0,124.762,24.866,79.944)"
          >
            <stop offset="0" stop-color="#ffb81f" />
            <stop offset=".6" stop-color="#db00d3" />
            <stop offset="1" stop-color="#5900cc" />
          </radialGradient>
          <radialGradient
            id="admin-badge-g5"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(120.557,0,0,120.557,65.094,162.826)"
          >
            <stop offset="0" stop-color="#ffe11f" />
            <stop offset=".6" stop-color="#ff22f7" />
            <stop offset="1" stop-color="#6300e3" />
          </radialGradient>
          <radialGradient
            id="admin-badge-g6"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(122.348,0,0,122.348,71.108,126.972)"
          >
            <stop offset="0" stop-color="#ffe11f" />
            <stop offset=".6" stop-color="#ff22f7" />
            <stop offset="1" stop-color="#6300e3" />
          </radialGradient>
          <radialGradient
            id="admin-badge-g7"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(-101.49,0,0,-101.49,408.583,29.538)"
          >
            <stop offset="0" stop-color="#00ffdd" />
            <stop offset=".995" stop-color="#6f27ff" />
          </radialGradient>
          <radialGradient
            id="admin-badge-g8"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(-106.677,0,0,-106.677,455.732,156.086)"
          >
            <stop offset="0" stop-color="#00b7ff" />
            <stop offset=".995" stop-color="#6f27ff" />
          </radialGradient>
          <radialGradient
            id="admin-badge-g9"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(-119.223,0,0,-119.223,469.452,95.967)"
          >
            <stop offset="0" stop-color="#00b7ff" />
            <stop offset=".995" stop-color="#6f27ff" />
          </radialGradient>
          <radialGradient
            id="admin-badge-g10"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(-124.762,0,0,-124.762,465.645,63.946)"
          >
            <stop offset="0" stop-color="#00b7ff" />
            <stop offset=".995" stop-color="#6f27ff" />
          </radialGradient>
          <radialGradient
            id="admin-badge-g11"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(-95.303,0,0,-95.303,438.991,144.888)"
          >
            <stop offset="0" stop-color="#00ffdd" />
            <stop offset=".995" stop-color="#6f27ff" />
          </radialGradient>
          <radialGradient
            id="admin-badge-g12"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(-97.001,0,0,-97.001,437.34,120.67)"
          >
            <stop offset="0" stop-color="#00ffdd" />
            <stop offset=".995" stop-color="#6f27ff" />
          </radialGradient>
          <linearGradient
            id="admin-badge-g13"
            x2="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(278.838,0,0,104.414,108.788,19.734)"
          >
            <stop offset="0" stop-color="#ffc560" />
            <stop offset=".224" stop-color="#ffe071" />
            <stop offset=".494" stop-color="#ffffb3" />
            <stop offset=".607" stop-color="#fdad24" />
            <stop offset=".819" stop-color="#fd19cf" />
            <stop offset="1" stop-color="#8211ab" />
          </linearGradient>
          <radialGradient
            id="admin-badge-g14"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(378.688,0,0,378.688,152.725,27.648)"
          >
            <stop offset="0" stop-color="#fff70e" />
            <stop offset=".412" stop-color="#ff36ff" />
            <stop offset="1" stop-color="#0091ff" />
          </radialGradient>
          <clipPath clipPathUnits="userSpaceOnUse" id="admin-badge-cp1">
            <path d="m346.68 116.91c-13.47-9.9-27.65-18.99-42.13-27.35-14.47-8.36-29.43-16.09-44.75-22.81-7.95-3.48-15.24-3.48-23.19 0-15.31 6.72-30.27 14.45-44.75 22.81-14.48 8.36-28.65 17.45-42.13 27.35-7 5.15-10.64 11.46-11.59 20.09-1.84 16.62-2.63 33.44-2.63 50.16 0 16.72 0.79 33.54 2.63 50.16 0.95 8.63 4.59 14.94 11.59 20.08 13.48 9.91 27.65 19 42.13 27.36 14.48 8.35 29.44 16.09 44.75 22.8 7.95 3.49 15.24 3.49 23.19 0 15.32-6.71 30.28-14.45 44.75-22.8 14.48-8.36 28.66-17.45 42.13-27.36 7-5.14 10.64-11.45 11.6-20.08 1.84-16.62 2.62-33.44 2.62-50.16 0-16.72-0.78-33.54-2.62-50.16-0.96-8.63-4.6-14.94-11.6-20.09z" />
          </clipPath>
          <radialGradient
            id="admin-badge-g15"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(453.461,0,0,453.461,159.36,5.372)"
          >
            <stop offset=".214" stop-color="#ffbb00" />
            <stop offset=".469" stop-color="#f011f0" />
            <stop offset=".767" stop-color="#2ba3ff" />
          </radialGradient>
          <linearGradient
            id="admin-badge-g16"
            x2="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(220.526,0,0,74.625,137.944,235.553)"
          >
            <stop offset="0" stop-color="#be3ac2" />
            <stop offset=".238" stop-color="#9763ff" />
            <stop offset=".506" stop-color="#70e9ff" />
            <stop offset=".776" stop-color="#3399ff" />
            <stop offset="1" stop-color="#4089ff" />
          </linearGradient>
        </defs>

        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s0}
          d="m118.4 115.5v22.6c-13.3-4-31.8-12.8-42.1-23.2-7.5-7.5-10.6-24.6-8.9-34.3 11.6 3.4 31.6 15.5 42.6 24.8 2.7 2.2 6.8 7.6 8.4 10.1z"
        />
        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s1}
          d="m118.4 220.8v34.3c-20.6-3.2-37.6-7-51.1-15.9-10.8-7.3-22.5-30.2-22.2-42.1 14.9-0.8 45.8 5.1 61.1 13.3 3.7 2 9.1 7 12.2 10.4z"
        />
        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s2}
          d="m118.4 181.8v37.9c-26.1-6.3-50.4-11.1-67.3-23.6-13.3-9.8-24.1-36.9-22.9-51.2 18.9 0.9 57.8 11.6 76.7 23.2 4.5 2.8 11 9.4 13.5 13.7z"
        />
        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s3}
          d="m118.4 139.6l-0.1 40.3c-29.6-7.7-57-13.6-76.2-29.4-15.1-12.4-27.2-38.7-25.7-56.9 21.3 0.8 65.3 14.1 86.7 28.7 5.1 3.5 12.4 11.8 15.3 17.3z"
        />
        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s4}
          d="m118.4 204.8v24.3c-18.1-2.6-34.1-8.3-45.6-17.3-9.3-7.3-16.5-24.7-16-35.4 14 1.2 38.1 9.8 51.2 18.3 3.2 2.1 7.7 6.9 10.4 10.1z"
        />
        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s5}
          d="m118.4 166.1v32c-21.1-5.6-42.9-16.6-56.3-28.7-10.9-9.7-16.2-27.9-15.8-39.9 18.1 1.8 39.7 6.9 53.8 16.9 3.8 2.7 15.3 14.8 18.3 19.7z"
        />
        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s6}
          d="m380.9 115.5v22.6c13.2-4 31.8-12.8 42.1-23.2 7.4-7.5 10.6-24.6 8.8-34.3-11.6 3.4-31.5 15.5-42.6 24.8-2.6 2.2-6.8 7.6-8.3 10.1z"
        />
        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s7}
          d="m380.9 220.8v34.3c20.5-3.2 37.6-7 51-15.9 10.8-7.3 22.6-30.2 22.2-42.1-14.8-0.8-45.8 5.1-61.1 13.3-3.7 2-9 7-12.1 10.4z"
        />
        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s8}
          d="m380.9 181.8v37.9c26.1-6.3 50.3-11.1 67.2-23.6 13.4-9.8 24.2-36.9 22.9-51.2-18.9 0.9-57.8 11.6-76.6 23.2-4.6 2.8-11 9.4-13.5 13.7z"
        />
        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s9}
          d="m380.9 139.6l0.1 40.3c29.5-7.7 57-13.6 76.1-29.4 15.1-12.4 27.2-38.7 25.8-56.9-21.4 0.8-65.4 14.1-86.7 28.7-5.2 3.5-12.5 11.8-15.3 17.3z"
        />
        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s10}
          d="m380.9 204.8v24.3c18-2.6 34.1-8.3 45.5-17.3 9.3-7.3 16.5-24.7 16.1-35.4-14 1.2-38.2 9.8-51.3 18.3-3.1 2.1-7.7 6.9-10.3 10.1z"
        />
        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s11}
          d="m380.9 166.1v32c21.1-5.6 42.9-16.6 56.3-28.7 10.8-9.7 16.1-27.9 15.7-39.9-18.1 1.8-39.7 6.9-53.8 16.9-3.8 2.7-15.2 14.8-18.2 19.7z"
        />
        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s12}
          d="m387.6 124.1l-4.2-15.8c-2.6-9.7-6.7-17-13.6-24.4-10.4-10.6-31.3-23.2-44.3-31.1-17.5-10.4-35.3-19.8-53.9-28-16-6.8-30.8-6.8-46.8 0-18.6 8.2-36.4 17.6-53.9 28-13 7.9-33.9 20.5-44.3 31.1-6.9 7.4-10.9 14.7-13.6 24.4l-4.2 15.8z"
        />
        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s13}
          d="m365.2 91.7c-13.2-9.7-28.4-19.7-45-29.2-16.6-9.6-32.8-17.8-47.8-24.4-16-7-32.4-7-48.4 0-15 6.6-31.2 14.8-47.8 24.4-16.5 9.5-31.8 19.5-45 29.2-14 10.3-22.2 24.5-24.1 41.9-1.9 16.3-2.9 34.4-2.9 53.6 0 19.1 1 37.2 2.9 53.6 1.9 17.3 10.1 31.5 24.1 41.8 13.2 9.7 28.5 19.7 45 29.2 16.6 9.6 32.8 17.8 47.8 24.4 16 7 32.4 7 48.4 0 15-6.6 31.2-14.8 47.8-24.4 16.6-9.5 31.8-19.5 45-29.2 14.1-10.3 22.2-24.5 24.2-41.8 1.8-16.4 2.8-34.5 2.8-53.6 0-19.2-1-37.3-2.8-53.6-2-17.4-10.1-31.6-24.2-41.9z"
        />
        <g clip-path="url(#admin-badge-cp1)">
          <path
            id="admin-badge-&lt;Path&gt;"
            class={styles.s14}
            d="m346.7 116.9c-13.5-9.9-27.7-19-42.1-27.3-14.5-8.4-29.5-16.1-44.8-22.8-7.9-3.5-15.2-3.5-23.2 0-15.3 6.7-30.3 14.4-44.7 22.8-14.5 8.3-28.7 17.4-42.2 27.3-7 5.2-10.6 11.5-11.6 20.1-1.8 16.6-2.6 33.4-2.6 50.2 0 16.7 0.8 33.5 2.6 50.1 1 8.7 4.6 15 11.6 20.1 13.5 9.9 27.7 19 42.2 27.4 14.4 8.3 29.4 16 44.7 22.8 8 3.5 15.3 3.5 23.2 0 15.3-6.8 30.3-14.5 44.8-22.8 14.4-8.4 28.6-17.5 42.1-27.4 7-5.1 10.6-11.4 11.6-20.1 1.8-16.6 2.6-33.4 2.6-50.1 0-16.8-0.8-33.6-2.6-50.2-1-8.6-4.6-14.9-11.6-20.1z"
          />

          <foreignObject x="125px" y="58px" width="250px" height="250px">
            <Switch>
              <Match when={!props.children}>
                <Show when={!props.url && props.color}>
                  <div
                    style={{ "background-color": props.color }}
                    class={styles.background}
                  />
                </Show>
                <img
                  src={props.url || "/assets/profile.png"}
                  width="100%"
                  height="100%"
                  loading="lazy"
                />
              </Match>
              <Match when={props.children}>{props.children}</Match>
            </Switch>
          </foreignObject>
        </g>
        <path
          id="admin-badge-&lt;Path&gt;"
          class={styles.s15}
          d="m236.4 299.3c-15.6-6.9-30.8-14.7-45.6-23.3-14.7-8.5-29.1-17.7-42.9-27.8-4.8-3.6-8.1-7.6-10-12.6q0.1 0.8 0.2 1.7c1 8.7 4.6 15 11.6 20.1 13.5 9.9 27.7 19 42.2 27.4 14.4 8.3 29.4 16 44.7 22.8 8 3.5 15.3 3.5 23.2 0 15.3-6.8 30.3-14.5 44.8-22.8 14.4-8.4 28.6-17.5 42.1-27.4 7-5.1 10.6-11.4 11.6-20.1q0.1-0.9 0.2-1.7c-1.9 5-5.2 9-10 12.6-13.7 10.1-28.2 19.3-42.9 27.8-14.8 8.6-30 16.4-45.6 23.3-8.1 3.5-15.5 3.5-23.6 0z"
        />
      </svg>
    </div>
  );
}
