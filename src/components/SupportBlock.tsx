import { A } from "solid-navigator";
import { styled } from "solid-styled-components";
import ItemContainer from "./ui/LegacyItem";
import { FlexRow } from "./ui/Flexbox";
import Icon from "./ui/icon/Icon";
import { t } from "i18next";
import Text from "./ui/Text";
const SettingItemContainer = styled(ItemContainer)<{ nested?: boolean }>`
  height: 32px;
  gap: 5px;
  padding-left: ${(props) => (props.nested ? "25px" : "10px")};
  margin-left: 3px;
  margin-right: 3px;
  margin-bottom: 2px;
  :first {
    background-color: red;
  }

  .label {
    opacity: ${(props) => (props.selected ? 1 : 0.6)};
    font-size: 14px;
    transition: 0.2s;
    color: white;
  }

  &:hover .label {
    opacity: 1;
  }
`;
export function SupportBlock() {
  return (
    <A
      href="https://ko-fi.com/supertiger"
      target="_blank"
      rel="noopener noreferrer"
      style={{ "text-decoration": "none" }}
    >
      <SettingItemContainer
        style={{
          background: "var(--alert-color)",
          "border-radius": "6px",
          height: "initial",
          padding: "6px",
          "align-items": "start",
          "flex-direction": "column",
        }}
      >
        <FlexRow gap={4}>
          <Icon
            style={{ "align-self": "start", "margin-top": "3px" }}
            name="favorite"
            size={18}
          />
          <div>
            <Text style={{ "font-weight": "bold" }}>
              {t("supportBlock.support")}
            </Text>
            <div>
              <Text size={12}>{t("supportBlock.supportDescription")}</Text>
            </div>
          </div>
        </FlexRow>
      </SettingItemContainer>
    </A>
  );
}
