import ContextMenu, {
  ContextMenuProps,
} from "@/components/ui/context-menu/ContextMenu";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { EditFolderModal } from "./EditFolderModal";

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
          label: "Edit Folder",
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
