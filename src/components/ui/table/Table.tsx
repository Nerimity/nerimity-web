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
  headerId: string;
  mode: TableSortMode;
}
export interface TableHeader {
  title: JSXElement;
  id: string;
}
interface TableProps {
  headers: TableHeader[];
  children?: JSXElement[] | JSXElement;
  sortableHeaderIds?: string[];
  onHeaderClick?: (sort: TableSort) => void;
  sort?: TableSort;
}
const Root = (props: TableProps) => {
  const { isMainPaneMobileWidth } = useWindowProperties();

  return (
    <Switch>
      <Match when={!isMainPaneMobileWidth()}>
        <DesktopTable {...props} />
      </Match>
      <Match when={isMainPaneMobileWidth()}>
        <MobileTable {...props} />
      </Match>
    </Switch>
  );
};

interface ItemProp {
  children?: JSXElement;
  onClick?: (event: MouseEvent) => void;
  onContextMenu?: (event: MouseEvent) => void;
  href?: string;
  class?: string;
}

const TableItem = (props: ItemProp) => {
  const { isMainPaneMobileWidth } = useWindowProperties();
  return (
    <Switch>
      <Match when={!isMainPaneMobileWidth()}>
        <DesktopItem {...props} />
      </Match>
      <Match when={isMainPaneMobileWidth()}>
        <MobileItem {...props} />
      </Match>
    </Switch>
  );
};

const DesktopTable = (props: TableProps) => {
  const isHeaderSortable = (tableHeader: TableHeader) => {
    return props.sortableHeaderIds?.includes(tableHeader.id);
  };
  const isHeaderSorted = (header: TableHeader) => {
    return props.sort?.headerId === header.id;
  };
  const onHeaderClick = (header: TableHeader) => {
    if (!isHeaderSortable(header)) return;
    const mode = isHeaderSorted(header)
      ? props.sort?.mode === "asc"
        ? "desc"
        : "asc"
      : "asc";
    props.onHeaderClick?.({
      headerId: header.id,
      mode,
    });
  };
  return (
    <table class={style.table_component}>
      <thead>
        <tr>
          <For each={props.headers}>
            {(header) => (
              <th
                onClick={() => onHeaderClick(header)}
                class={cn(
                  style.header,
                  isHeaderSortable(header) ? style.clickable : null,
                  isHeaderSorted(header) ? style.sorted : null
                )}
              >
                <div class={style.headerContainer}>
                  {header.title}
                  <Show when={isHeaderSortable(header)}>
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
  const { isMainPaneMobileWidth } = useWindowProperties();
  return (
    <Switch>
      <Match when={!isMainPaneMobileWidth()}>
        <DesktopField {...props} />
      </Match>
      <Match when={isMainPaneMobileWidth()}>
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
    <span class={style.mobileField}>
      <Show when={props.mobileTitle}>
        <span class={style.mobileTitle}>{props.mobileTitle}: </span>
      </Show>
      {props.children}
    </span>
  );
};

const DesktopItem = (props: ItemProp) => {
  const child = children(() => props.children);
  const els = () => child.toArray();
  return (
    <tr
      class={cn(
        props.class,
        props.onClick || props.href ? style.clickable : null
      )}
    >
      <For each={els()}>
        {(el) => (
          <td onClick={props.onClick} onContextMenu={props.onContextMenu}>
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
        class={cn(
          props.class,
          style.mobileItem,
          props.onClick || props.href ? style.clickable : null
        )}
        onClick={props.onClick}
        onContextMenu={props.onContextMenu}
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
  const isHeaderSortable = (header: TableHeader) => {
    return props.sortableHeaderIds?.includes(header.id);
  };
  const onHeaderClick = (header: TableHeader) => {
    if (!isHeaderSortable(header)) return;
    const mode =
      props.sort?.headerId === header.id
        ? props.sort?.mode === "asc"
          ? "desc"
          : "asc"
        : "asc";
    props.onHeaderClick?.({
      headerId: header.id,
      mode,
    });
  };

  const changeSortMode = (mode: "asc" | "desc") => {
    if (!props.sort?.headerId) return;
    props.onHeaderClick?.({
      headerId: props.sort.headerId,
      mode,
    });
  };
  return (
    <Show when={props.sort}>
      <div class={style.mobileSortOptions}>
        <div>Sort By</div>
        <div class={style.sortOptions}>
          <For each={props.sortableHeaderIds}>
            {(headerId) => (
              <Item.Root
                selected={headerId === props.sort?.headerId}
                handlePosition="bottom"
                onClick={() =>
                  onHeaderClick(props.headers.find((h) => h.id === headerId)!)
                }
              >
                <Item.Label>
                  {props.headers.find((h) => h.id === headerId)!.title}
                </Item.Label>
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
