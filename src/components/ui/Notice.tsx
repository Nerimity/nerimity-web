import { css, styled } from "solid-styled-components";
import { FlexRow } from "./Flexbox";
import Icon from "./icon/Icon";
import Text from "./Text";

const NoticeContainer = styled(FlexRow)<{bgColor: string, borderColor: string}>`
  background: ${props => props.bgColor};
  border: solid 1px ${props => props.borderColor};
  border-radius: 8px;
  padding: 10px;
  align-items: center;
`;

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
  }
}

interface NoticeProps {
  class?: string;
  description: string;
  type: keyof typeof noticeType;
}

export function Notice(props: NoticeProps) {
  const typeMeta = noticeType[props.type];
  return (
    <NoticeContainer gap={10} class={props.class} bgColor={typeMeta.color} borderColor={typeMeta.borderColor} >
      <Icon color={typeMeta.borderColor} class={css`align-self: start;`} size={24} name={typeMeta.icon} />
      <Text size={13}>{props.description}</Text>
    </NoticeContainer>
  )
}