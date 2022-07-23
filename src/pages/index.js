const fs = require("fs");
const path = require("path");


const getTsxFile = (dirnameArr) => {
  return dirnameArr.find((file) => {
    return file.includes(".tsx");
  });
}

const dir = fs.readdirSync("./");

dir.forEach((dirname) => {
  if (dirname === "index.js") return;

  const readFiles = fs.readdirSync(dirname);


  // fs.unlinkSync(path.join(dirname, "index.ts"));


  const fileName = path.join(dirname, getTsxFile(readFiles));
  const newFilename = path.join(dirname, "index.tsx");
  fs.renameSync(fileName, newFilename)

})


