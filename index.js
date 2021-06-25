// ! create the source and destination folders)

const fs = require("fs");
const path = require("path");
const svgtojsx = require("svg-to-jsx");
const prettier = require("prettier");

const iconsDir = "./icons";
const resultDir = "./result";
const exportFolder = "svgs";

const renames = {
  "Ellipse 32": "Ellipse",
  X: "Cross",
};

const mapExports = {
  imports: "",
  map: [],
};

const toKebab = (fname) =>
  fname
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase()
    .split(" ")
    .join("-");

const makeImport = (fname) =>
  `import { ${fname} } from "./${exportFolder}/${fname}";\n`;
const makeProp = (fname) => `"${toKebab(fname)}": ${fname},\n`;

const changeAttributes = (_svgText) => {
  let svgText = _svgText;
  svgText = svgText.replace(/width="[^\"]*"/, `width="1em"`);
  svgText = svgText.replace(/height="[^\"]*"/, `height="1em"`);

  ["#788494", "#6AA289", "none"].forEach((c) => {
    svgText = svgText.replace(
      new RegExp(`stroke="${c}"`, "g"),
      `stroke={stroke}`
    );
    svgText = svgText.replace(new RegExp(`fill="${c}"`, "g"), `fill={fill}`);
  });
  // svgText = svgText.replace(/stroke="#788494"/g, `stroke={stroke}`);
  // svgText = svgText.replace(/fill="#788494"/g, `fill={fill}`);
  svgText = svgText.replace(/fill={fill}/, `fill="none"`);

  return svgText;
};

const makeCode = ({ fname, jsx }) => {
  return prettier.format(
    `
import React from "react";

export const ${fname}: React.FC<React.SVGAttributes<SVGSVGElement>> =
    ({ stroke="currentColor", fill="currentColor", ...svgProps }) => {
  return (
    ${jsx}
  );
}
`,
    { parser: "babel" }
  );
};

const makeMapJs = (mapExports) =>
  prettier.format(
    `
${mapExports.imports}
export const iconList = {
  ${mapExports.map.join("  ")}}`,
    { semi: false, praser: "babel" }
  );

async function main() {
  fs.readdir(iconsDir, async (err, files) => {
    await Promise.all(
      files.map(async (file) => {
        let fname = path
          .basename(file, path.extname(file))
          .replace(/[_-]/g, "");

        if (renames[fname.trim()]) fname = renames[fname];

        let svg = fs.readFileSync(path.join(iconsDir, file)).toString();

        const code = await svgtojsx(svg).then(function (jsx) {
          jsx = changeAttributes(jsx);
          jsx = jsx.replace(">", " {...svgProps}>");
          return makeCode({
            fname,
            jsx,
          });
        });

        const pname = path.join(resultDir, fname) + ".tsx";
        fs.writeFileSync(pname, code, function (err) {
          if (err) console.log(err);
        });

        mapExports.imports += makeImport(fname);
        mapExports.map.push(makeProp(fname));
      })
    );
    fs.writeFile(
      path.join(__dirname, "map.js"),
      prettier.format(makeMapJs(mapExports), { semi: false, praser: "babel" }),
      function (err) {
        if (err) console.error(err);
      }
    );
  });
}

main();
