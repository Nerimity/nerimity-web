import { Accessor, onMount } from "solid-js";


export interface FileBrowserRef {
  open(): void
}

interface BaseProps {
  ref?: Accessor<FileBrowserRef | undefined>
  accept?: "any" | "images"
}

interface PropsBase64 {
  base64: true
  onChange?: (files: string[], rawFiles?: FileList) => void
}
interface PropsFileList {
  base64?: false
  onChange?: (files: FileList) => void
}

type Props = BaseProps & (PropsBase64 | PropsFileList)


export default function FileBrowser(props: Props) {
  let inputRef: undefined | HTMLInputElement; 
  const accept = props.accept === "images" ? "image/gif, image/webp, image/png, image/jpeg" : "";

  onMount(() => {
    (props?.ref as any)({
      open: () => inputRef?.click()
    });
  });


  const onChange = async () => {
    if (!inputRef) return;
    if (props.base64) {
      props.onChange?.(await filesToBase64(inputRef.files!), inputRef.files!);
    }
    if (!props.base64) {
      props.onChange?.(inputRef.files!);
    }
    inputRef.value = "";

  };

  return (
    <input 
      onChange={onChange}
      style={{display: "none"}}
      ref={inputRef}
      type="file"
      accept={accept}/>
  );
}

async function filesToBase64(files: FileList) {
  const base64Files = [];
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const base64 = await getBase64(file);
    base64 && base64Files.push(base64);     
  }
  return base64Files;
}


export function getBase64(file: File): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
      resolve(reader.result?.toString());
    };
    reader.onerror = function (error) {
      console.log("Error: ", error);
    };
  });
}