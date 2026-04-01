import { StorageKeys, useLocalStorage } from "@/common/localStorage";
import ContextMenu, { ContextMenuProps } from "../ui/context-menu/ContextMenu";

const [sideHomeIcon, setSideHomeIcon] = useLocalStorage<"default" | "legacy">(
  StorageKeys.HOME_ICON,
  "default"
);

type Props = Omit<ContextMenuProps, "items">;

export const SideBarHomeContextMenu = (props: Props) => {
  return (
    <ContextMenu
      {...props}
      items={[
        {
          label: "Toggle Icon",
          onClick: () =>
            setSideHomeIcon(
              sideHomeIcon() === "default" ? "legacy" : "default"
            ),
          icon: "refresh"
        }
      ]}
    />
  );
};

export { sideHomeIcon };
