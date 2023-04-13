
export function fileToDataUrl(file: File) {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve(reader.result)
    },false);
  
    reader.readAsDataURL(file);
  })
}