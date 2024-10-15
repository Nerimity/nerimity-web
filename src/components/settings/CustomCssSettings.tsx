import { createEffect, createSignal, lazy } from "solid-js";
import { styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";
import {
  getStorageString,
  setStorageString,
  StorageKeys,
} from "@/common/localStorage";
import Button from "../ui/Button";
import { Notice } from "../ui/Notice/Notice";
import { applyCustomCss } from "@/common/customCss";

const CodeMirror = lazy(() => import("@/components/code-mirror/CodeMirror"));

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  height: 100%;
`;

export default function CustomCssSettings() {
  const { header } = useStore();
  const [css, setCss] = createSignal(
    getStorageString(StorageKeys.CUSTOM_CSS, "")
  );

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Custom CSS",
      iconName: "settings",
    });
  });

  const onSaveClick = () => {
    setStorageString(StorageKeys.CUSTOM_CSS, css());
    applyCustomCss();
  };

  return (
    <Container>
      <Breadcrumb style={{ "margin-bottom": "8px" }}>
        <BreadcrumbItem href="/app" icon="home" title="Dashboard" />
        <BreadcrumbItem title={t("settings.drawer.interface")} href="../" />
        <BreadcrumbItem title="Custom CSS" />
      </Breadcrumb>

      <Notice
        type="warn"
        description="Do not paste code from people you don't trust."
      />
      <CodeMirror value={css()} onValueChange={setCss} />
      <Button
        label="Save & Apply"
        onClick={onSaveClick}
        iconName="save"
        margin={0}
      />
    </Container>
  );
}
