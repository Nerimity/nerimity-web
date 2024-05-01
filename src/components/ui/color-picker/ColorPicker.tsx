import Icon from "../icon/Icon";
import styles from "./styles.module.scss";

import "@melloware/coloris/dist/coloris.css";
import Coloris, { coloris, init, updatePosition } from "@melloware/coloris";
import { createEffect, createSignal, on, onMount } from "solid-js";
import Modal from "../modal/Modal";
import { useCustomPortal } from "../custom-portal/CustomPortal";
import { useWindowProperties } from "@/common/useWindowProperties";
import { classNames, conditionalClass } from "@/common/classNames";

init();

export function ColorPicker(props: { color: string | null, onChange?: (value: string) => void }) {
  const {createPortal} = useCustomPortal();
  

  let timeout: null | number = null;

  const onChange = (color: string) => {
    clearTimeout(timeout || 0);
    timeout = window.setTimeout(() => {
      props.onChange?.(color);  
    }, 10);
  };

  const onClicked = () => {
    createPortal?.(close => <ColorPickerModal color={props.color} close={close} onChange={onChange} />);
  };

  return (
    <>
    
      <div class={styles.colorPicker} style={{ background: props.color || "transparent" }} onClick={onClicked}>

        <Icon name='colorize' color='white' size={18} class={styles.icon} />
      </div>
    </>
  );
}

export const ColorPickerModal = (props: {color: string | null, done?: (color: string) => void, close: () => void, onChange: (value: string) => void}) => {
  const {isMobileWidth, width} = useWindowProperties();
  let color = props.color || "#000000";
  const onChange = (newVal: string) => {
    props.onChange(newVal);
    color = newVal;
  };

  const initColoris = () => coloris({themeMode: "dark", parent: "#coloris", defaultColor: props.color || "black", inline: true, onChange});


  onMount(() => {
    initColoris(); 
    setTimeout(() => {
      updatePosition();
    }, 100);
  });



  let timeout: null | number = null;
  
  createEffect(on(width, () => {
    clearTimeout(timeout || 0);
    timeout = window.setTimeout(initColoris, 100);
  }));

  const done = () => {
    props.close();
    props.done?.(color!);
  };


  return <Modal title="Color Picker" close={props.close} ignoreBackgroundClick actionButtonsArr={[{label: "Done", onClick: done, iconName: "done", primary: true}]}>
    <div class={classNames(styles.colorPickerContainer, conditionalClass(isMobileWidth(), styles.mobile))}><div id="coloris" /></div>
  </Modal>;
};