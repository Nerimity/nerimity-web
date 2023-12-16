import { JSXElement, Match, Show, Switch } from "solid-js";
import styles from "./SupporterBorderSvg.module.css";

export function SupporterBorderSvg(props: { children?: JSXElement; color?: string; url?: string, hovered?: boolean }) {
  return (
    <div
      class={styles.container}
      classList={{[styles.hovered]: props.hovered}}
    >
      <svg
        version="1.2"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 500 362"
        style={{ scale: 1.8 }}
      >
        <defs>
          <radialGradient
            id="g1"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(65.765,0,0,65.765,462.399,199.572)"
          >
            <stop offset="0" stop-color="#e8fff8" />
            <stop offset="1" stop-color="#f7a1f6" />
          </radialGradient>
          <radialGradient
            id="g2"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(75.187,0,0,75.187,474.941,167.105)"
          >
            <stop offset="0" stop-color="#e8fff8" />
            <stop offset="1" stop-color="#f7a1f6" />
          </radialGradient>
          <radialGradient
            id="g3"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(89.298,0,0,89.298,465.101,89.929)"
          >
            <stop offset="0" stop-color="#e8fff8" />
            <stop offset="1" stop-color="#f7a1f6" />
          </radialGradient>
          <radialGradient
            id="g4"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(-65.765,0,0,-65.765,36.966,199.572)"
          >
            <stop offset="0" stop-color="#e8fff8" />
            <stop offset="1" stop-color="#f7a1f6" />
          </radialGradient>
          <radialGradient
            id="g5"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(-75.187,0,0,-75.187,24.423,167.105)"
          >
            <stop offset="0" stop-color="#e8fff8" />
            <stop offset="1" stop-color="#f7a1f6" />
          </radialGradient>
          <radialGradient
            id="g6"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(-89.298,0,0,-89.298,34.264,89.929)"
          >
            <stop offset="0" stop-color="#e8fff8" />
            <stop offset="1" stop-color="#f7a1f6" />
          </radialGradient>
          <linearGradient
            id="g7"
            x2="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(290.908,0,0,108.934,104.228,13)"
          >
            <stop offset="0" stop-color="#e346c9" />
            <stop offset=".224" stop-color="#f05ed7" />
            <stop offset=".494" stop-color="#f880e4" />
            <stop offset=".762" stop-color="#b40a97" />
            <stop offset="1" stop-color="#97097f" />
          </linearGradient>
          <radialGradient
            id="g8"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(395.08,0,0,395.08,150.067,21.257)"
          >
            <stop offset="0" stop-color="#f776e2" />
            <stop offset="1" stop-color="#d70db5" />
          </radialGradient>
          <clipPath clipPathUnits="userSpaceOnUse" id="cp1">
            <path d="m352.42 114.39c-14.06-10.33-28.85-19.82-43.95-28.54-15.11-8.72-30.71-16.79-46.69-23.79-8.3-3.64-15.9-3.64-24.2 0-15.97 7-31.58 15.07-46.68 23.79-15.11 8.72-29.9 18.2-43.95 28.54-7.31 5.36-11.11 11.95-12.1 20.95-1.92 17.34-2.74 34.89-2.74 52.33 0 17.44 0.82 34.99 2.74 52.33 0.99 9.01 4.79 15.59 12.1 20.96 14.05 10.33 28.84 19.81 43.95 28.53 15.1 8.73 30.71 16.79 46.68 23.8 8.3 3.64 15.9 3.64 24.2 0 15.98-7.01 31.58-15.07 46.69-23.8 15.1-8.72 29.89-18.2 43.95-28.53 7.3-5.37 11.1-11.95 12.1-20.96 1.92-17.34 2.74-34.89 2.74-52.33 0-17.44-0.82-34.99-2.74-52.33-1-9-4.8-15.59-12.1-20.95z" />
          </clipPath>
          <radialGradient
            id="g9"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(301.672,0,0,301.672,177.853,51.996)"
          >
            <stop offset="0" stop-color="#ff8af3" />
            <stop offset="1" stop-color="#c400a3" />
          </radialGradient>
          <linearGradient
            id="g10"
            x2="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(230.072,0,0,77.856,134.646,238.161)"
          >
            <stop offset="0" stop-color="#bd16a1" />
            <stop offset=".181" stop-color="#d92bbb" />
            <stop offset=".521" stop-color="#f558db" />
            <stop offset=".776" stop-color="#f43cd5" />
            <stop offset="1" stop-color="#f329d1" />
          </linearGradient>
        </defs>

          <path
            id="&lt;Path&gt;"
            class={styles.s0}
            d="m392.2 213.7v39.8c18.8-3.2 34.4-7 46.6-16.2 9.6-7.4 19.2-35.7 18.3-47.9-13.6-0.8-41.6 5.3-55.2 13.7-3.3 2-7.9 7.1-9.7 10.6z"
          />
          <path
            id="&lt;Path&gt;"
            class={styles.s1}
            d="m392.2 169.3v38.8c22.6-4 43.5-6.7 58.2-17.8 11.5-8.8 20.9-35.5 19.8-50.2-16.4-0.9-50 6.4-66.3 16.5-4 2.4-9.5 8.5-11.7 12.7z"
          />
          <path
            id="&lt;Path&gt;"
            class={styles.s2}
            d="m392.2 125l0.1 37.6c26.4-4.6 50.9-7.8 67.9-20.8 13.5-10.3 24.3-33.8 23.1-50.9-19.1-1.1-58.4 7.4-77.4 19.2-4.7 2.8-11.2 10-13.7 14.9z"
          />
          <path
            id="&lt;Path&gt;"
            class={styles.s3}
            d="m107.2 213.7v39.8c-18.8-3.2-34.4-7-46.6-16.2-9.6-7.4-19.2-35.7-18.3-47.9 13.6-0.8 41.6 5.3 55.2 13.7 3.2 2 7.9 7.1 9.7 10.6z"
          />
          <path
            id="&lt;Path&gt;"
            class={styles.s4}
            d="m107.2 169.3v38.8c-22.6-4-43.6-6.7-58.2-17.8-11.6-8.8-20.9-35.5-19.8-50.2 16.3-0.9 50 6.4 66.3 16.5 3.9 2.4 9.5 8.5 11.7 12.7z"
          />
          <path
            id="&lt;Path&gt;"
            class={styles.s5}
            d="m107.2 125l-0.1 37.6c-26.4-4.6-50.9-7.8-68-20.8-13.5-10.3-24.3-33.8-23-50.9 19.1-1.1 58.4 7.4 77.4 19.2 4.6 2.8 11.1 10 13.7 14.9z"
          />


        <path
          id="&lt;Path&gt;"
          class={styles.s6}
          d="m395.1 121.9l-4.3-16.5c-2.8-10.1-7.1-17.7-14.2-25.4-10.9-11.1-32.7-24.2-46.3-32.5-18.2-10.8-36.8-20.6-56.2-29.2-16.7-7.1-32.1-7.1-48.9 0-19.3 8.6-37.9 18.4-56.1 29.2-13.7 8.2-35.4 21.4-46.3 32.5-7.2 7.7-11.4 15.3-14.2 25.4l-4.4 16.5z"
        />
        <path
          id="&lt;Path&gt;"
          class={styles.s7}
          d="m371.7 88.1c-13.8-10.2-29.6-20.5-46.9-30.5-17.3-10-34.2-18.5-49.9-25.4-16.7-7.3-33.8-7.3-50.4 0-15.7 6.9-32.6 15.4-49.9 25.4-17.3 10-33.2 20.3-47 30.5-14.6 10.8-23.2 25.6-25.2 43.7-1.9 17-2.9 35.9-2.9 55.9 0 19.9 1 38.9 2.9 55.9 2 18.1 10.6 32.9 25.2 43.7 13.8 10.1 29.7 20.5 47 30.5 17.3 9.9 34.2 18.5 49.9 25.4 16.6 7.3 33.7 7.3 50.4 0 15.7-6.9 32.6-15.5 49.9-25.4 17.3-10 33.1-20.4 46.9-30.5 14.7-10.8 23.2-25.6 25.2-43.7 1.9-17 3-36 3-55.9 0-20-1.1-38.9-3-55.9-2-18.1-10.5-32.9-25.2-43.7z"
        />
        <g clip-path="url(#cp1)">
    
          <foreignObject x="125px" y="58px" width="250px" height="250px">
            <Switch>
              <Match when={!props.children}>
                <Show when={!props.url && props.color}><div style={{"background-color": props.color}} class={styles.background}/></Show>
                <img src={props.url || "/assets/profile.png"} width="100%" height="100%" loading="lazy" />
              </Match>
              <Match when={props.children}>{props.children}</Match>
            </Switch>
          </foreignObject>
    
        </g>
        <path
          id="&lt;Path&gt;"
          class={styles.s9}
          d="m237.4 304.6c-16.3-7.1-32.2-15.3-47.6-24.2-15.4-8.9-30.4-18.5-44.7-29.1-5.1-3.7-8.5-7.9-10.5-13.1q0.1 0.9 0.2 1.8c1 9 4.8 15.6 12.1 21 14.1 10.3 28.9 19.8 44 28.5 15.1 8.7 30.7 16.8 46.7 23.8 8.3 3.6 15.9 3.6 24.2 0 16-7 31.6-15.1 46.7-23.8 15.1-8.7 29.9-18.2 43.9-28.5 7.3-5.4 11.1-12 12.1-21q0.1-0.9 0.2-1.8c-2 5.2-5.4 9.4-10.4 13.1-14.3 10.6-29.4 20.2-44.8 29.1-15.3 8.9-31.2 17.1-47.5 24.2-8.4 3.7-16.2 3.7-24.6 0z"
        />
      </svg>
    </div>
  );
}
