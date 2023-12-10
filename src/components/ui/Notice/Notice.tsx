import styles from './Notice.module.css';

import { JSX } from "solid-js";
import { classNames } from '@/common/classNames';
import Icon from "../icon/Icon";

const noticeType = {
  warn: {
    color: "var(--warn-color-dark)",
    borderColor: "var(--warn-color)",
    icon: "warning"
  },
  error: {
    color: "var(--alert-color-dark)",
    borderColor: "var(--alert-color)",
    icon: "error"
  },
  info: {
    color: "var(--primary-color-dark)",
    borderColor: "var(--primary-color)",
    icon: "info"
  },
  success: {
    color: "var(--success-color-dark)",
    borderColor: "var(--success-color)",
    icon: "check_circle"
  }
}

interface NoticeProps {
  class?: string;
  description: string;
  type: keyof typeof noticeType;
  children?: JSX.Element
  style?: JSX.CSSProperties
}

export function Notice(props: NoticeProps) {
  const typeMeta = noticeType[props.type];

  const style: JSX.CSSProperties = {
    ...props.style,
    background: typeMeta.color,
    border: `solid 1px ${typeMeta.borderColor}`,
  }

  return (
    <div class={classNames(styles.noticeContainer, props.class)} style={style}>
      <Icon color={typeMeta.borderColor} size={24} name={typeMeta.icon} />
      <div class={styles.noticeDescription}>{props.description}</div>
      {props.children}
    </div>
  )
}