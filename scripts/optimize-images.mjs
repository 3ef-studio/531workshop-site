import fs from "fs";
import path from "path";
import sharp from "sharp";

const inputDir = "./images-incoming";
const outputDir = "./public/images/projects";

const MAX_SIZE = 1600;
const QUALITY = 85;

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir);

for (const file of files) {
  const inputPath = path.join(inputDir, file);
  const name = path.parse(file).name;
  const outputPath = path.join(outputDir, `${name}.webp`);

  console.log(`Optimizing ${file} → ${name}.webp`);

  await sharp(inputPath)
    .resize({
      width: MAX_SIZE,
      height: MAX_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .toFile(outputPath);
}
