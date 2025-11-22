import ContextMenu, {
  ContextMenuProps,
} from "@/components/ui/context-menu/ContextMenu";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { EditFolderModal } from "./EditFolderModal";
import { t } from "@nerimity/i18lite";

type Props = Omit<ContextMenuProps, "items"> & {
  folderId?: string;
};

export default function ContextMenuServerFolder(props: Props) {
  const { createPortal } = useCustomPortal();

  return (
    <ContextMenu
      {...props}
      items={[
        {
          label: t("editFolderModal.title"),
          icon: "edit",
          onClick: () => {
            createPortal((c) => (
              <EditFolderModal close={c} folderId={props.folderId} />
            ));
          },
        },
      ]}
    />
  );
}
