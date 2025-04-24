import { children, For, JSXElement, Match, Switch, Show } from "solid-js";
import style from "./Table.module.scss";
import { useWindowProperties } from "@/common/useWindowProperties";
import { CustomLink } from "../CustomLink";
import { Dynamic } from "solid-js/web";
import { Fragment } from "@/common/Fragment";
import Icon from "../icon/Icon";
import { cn } from "@/common/classNames";
import { Item } from "../Item";

export type TableSortMode = "asc" | "desc";

export interface TableSort {
  index?: number;
  mode?: TableSortMode;
}
interface TableProps {
  headers: JSXElement[];
  children?: JSXElement[] | JSXElement;
  sortableHeaderIndexes?: number[];
  onHeaderClick?: (sort: TableSort) => void;
  sort?: TableSort;
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
  children?: JSXElement;
  onClick?: () => void;
  href?: string;
}

const TableItem = (props: ItemProp) => {
  const { isMobileWidth } = useWindowProperties();
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
  const isHeaderSortable = (i: number) => {
    return props.sortableHeaderIndexes?.includes(i);
  };
  const isHeaderSorted = (i: number) => {
    return props.sort?.index === i;
  };
  const onHeaderClick = (i: number) => {
    if (!isHeaderSortable(i)) return;
    const mode = isHeaderSorted(i)
      ? props.sort?.mode === "asc"
        ? "desc"
        : "asc"
      : "asc";
    props.onHeaderClick?.({
      index: i,
      mode,
    });
  };
  return (
    <table class={style.table_component}>
      <thead>
        <tr>
          <For each={props.headers}>
            {(header, i) => (
              <th
                onClick={() => onHeaderClick(i())}
                class={cn(
                  style.header,
                  isHeaderSortable(i()) ? style.clickable : null,
                  isHeaderSorted(i()) ? style.sorted : null
                )}
              >
                <div class={style.headerContainer}>
                  {header}
                  <Show when={isHeaderSortable(i())}>
                    <Icon name="unfold_more" size={14} class={style.sortIcon} />
                  </Show>
                </div>
              </th>
            )}
          </For>
        </tr>
      </thead>
      <tbody>{props.children}</tbody>
    </table>
  );
};

interface FieldProps {
  children?: JSXElement;
  mobileTitle?: string;
}

const Field = (props: FieldProps) => {
  const { isMobileWidth } = useWindowProperties();
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
  return (
    <div class={style.mobileField}>
      <Show when={props.mobileTitle}>
        <span class={style.mobileTitle}>{props.mobileTitle}:</span>
      </Show>
      {props.children}
    </div>
  );
};

const DesktopItem = (props: ItemProp) => {
  const child = children(() => props.children);
  const els = () => child.toArray();
  return (
    <tr>
      <For each={els()}>
        {(el) => (
          <td>
            <Dynamic
              component={props.href ? CustomLink : Fragment}
              href={props.href}
            >
              {el}
            </Dynamic>
          </td>
        )}
      </For>
    </tr>
  );
};

const MobileItem = (props: ItemProp) => {
  const child = children(() => props.children);
  return (
    <Show when={child()}>
      <Dynamic
        component={props.href ? CustomLink : "div"}
        href={props.href}
        class={style.mobileItem}
      >
        {child()}
      </Dynamic>
    </Show>
  );
};

const MobileTable = (props: TableProps) => {
  const child = children(() => props.children);
  const els = () => child.toArray();
  return (
    <div class={style.mobileTable}>
      <MobileSortOptions {...props} />
      {els()}
    </div>
  );
};

const MobileSortOptions = (props: TableProps) => {
  const isHeaderSortable = (i: number) => {
    return props.sortableHeaderIndexes?.includes(i);
  };
  const onHeaderClick = (i: number) => {
    if (!isHeaderSortable(i)) return;
    const mode =
      props.sort?.index === i
        ? props.sort?.mode === "asc"
          ? "desc"
          : "asc"
        : "asc";
    props.onHeaderClick?.({
      index: i,
      mode,
    });
  };

  const changeSortMode = (mode: "asc" | "desc") => {
    props.onHeaderClick?.({
      index: props.sort?.index ?? 0,
      mode,
    });
  };
  return (
    <Show when={props.sort}>
      <div class={style.mobileSortOptions}>
        <div>Sort By</div>
        <div class={style.sortOptions}>
          <For each={props.headers}>
            {(header, i) => (
              <Item.Root
                selected={i() === props.sort?.index}
                handlePosition="bottom"
                onClick={() => onHeaderClick(i())}
              >
                <Item.Label>{header}</Item.Label>
              </Item.Root>
            )}
          </For>
        </div>

        <div>Order By</div>
        <div class={style.sortOptions}>
          <Item.Root
            selected={props.sort?.mode === "asc"}
            handlePosition="bottom"
            onClick={() => changeSortMode("asc")}
          >
            <Item.Icon>unfold_less</Item.Icon>
            <Item.Label>Ascending</Item.Label>
          </Item.Root>
          <Item.Root
            selected={props.sort?.mode === "desc"}
            handlePosition="bottom"
            onClick={() => changeSortMode("desc")}
          >
            <Item.Icon>unfold_more</Item.Icon>
            <Item.Label>Descending</Item.Label>
          </Item.Root>
        </div>
      </div>
    </Show>
  );
};

export const Table = {
  Root,
  Item: TableItem,
  Field,
};
