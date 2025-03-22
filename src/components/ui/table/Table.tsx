import { children, For, JSXElement, Match, Switch, Show } from "solid-js";
import style from "./Table.module.scss";
import { useWindowProperties } from "@/common/useWindowProperties";
import { CustomLink } from "../CustomLink";
import { Dynamic } from "solid-js/web";
import { Fragment } from "@/common/Fragment";



interface TableProps {
  headers: JSXElement[];
  children?: JSXElement[] | JSXElement;
}
const Root = (props: TableProps) => {
  const { isMobileWidth } = useWindowProperties();

  return (
      <Switch>
        <Match when={!isMobileWidth()}>
          <DesktopTable {...props} />
        </Match>
        <Match when={isMobileWidth()}>
          <MobileTable {...props} />
        </Match>
      </Switch>
  );
};


interface ItemProp {
  children?: JSXElement, onClick?: () => void, href?: string 
}

const Item = (props: ItemProp) => {
  const {isMobileWidth} = useWindowProperties();
  return (
    <Switch>
      <Match when={!isMobileWidth()}>
        <DesktopItem {...props} />
      </Match>
      <Match when={isMobileWidth()}>
        <MobileItem {...props} />
      </Match>
    </Switch>
  );
};



const DesktopTable = (props: TableProps) => {
  return (
    <table class={style.table_component}>
      <thead>
        <tr>
          <For each={props.headers}>{(header) => <th>{header}</th>}</For>
        </tr>
      </thead>
      <tbody>
        {props.children}
      </tbody>
    </table>
  );
};


interface FieldProps {
  children?: JSXElement
  mobileTitle?: string
}

const Field = (props: FieldProps) => {
  const {isMobileWidth} = useWindowProperties();
  return (
    <Switch>
      <Match when={!isMobileWidth()}>
        <DesktopField {...props} />
      </Match>
      <Match when={isMobileWidth()}>
        <MobileField {...props} />
      </Match>
    </Switch>
  );
};


const DesktopField = (props: FieldProps) => {
  return <>{props.children}</>;
};
const MobileField = (props: FieldProps) => {
  return <div class={style.mobileField}><Show when={props.mobileTitle}><span class={style.mobileTitle}>{props.mobileTitle}:</span></Show>{props.children}</div>;
};


const DesktopItem = (props: ItemProp) => {
  const child = children(() => props.children);
  const els = () => child.toArray();
  return <tr><For each={els()}>{(el) => <td><Dynamic component={props.href ? CustomLink : Fragment} href={props.href}>{el}</Dynamic></td>}</For></tr>;
};

const MobileItem = (props: ItemProp) => {
  const child = children(() => props.children);
  return <Show when={child()}><Dynamic component={props.href ? CustomLink : Fragment} href={props.href} class={style.mobileItem}>{child()}</Dynamic></Show>;
};

const MobileTable = (props: TableProps) => {
  const child = children(() => props.children);
  const els = () => child.toArray();
  return (
    <div class={style.mobileTable}>
     {els()}
    </div>
  );
};

export const Table = {
  Root,
  Item,
  Field
};

