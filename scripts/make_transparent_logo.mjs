import { Jimp } from "jimp";
import path from "node:path";
import fs from "node:fs";

const src =
  "C:/Users/elfah/.cursor/projects/c-Users-elfah-Desktop-nextjs/assets/c__Users_elfah_AppData_Roaming_Cursor_User_workspaceStorage_092a5fd6024ad89c779f18ffb81fe59b_images_ChatGPT_Image_29_avr._2026__15_54_18-728cee6b-cf67-4af0-9ff6-2bc2a2d4a7a0.png";
const outDir = "C:/Users/elfah/Desktop/nextjs/public/branding";

fs.mkdirSync(outDir, { recursive: true });

const img = await Jimp.read(src);

img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
  const r = this.bitmap.data[idx + 0];
  const g = this.bitmap.data[idx + 1];
  const b = this.bitmap.data[idx + 2];
  if (r > 240 && g > 240 && b > 240) {
    this.bitmap.data[idx + 3] = 0;
  }
});

img.autocrop();
await img.write(path.join(outDir, "paypulse-logo-transparent.png"));

for (const size of [192, 512]) {
  const canvas = new Jimp({ width: size, height: size, color: 0x00000000 });
  const logo = img.clone();
  const max = Math.floor(size * 0.82);
  logo.scaleToFit({ w: max, h: max });
  const x = Math.floor((size - logo.bitmap.width) / 2);
  const y = Math.floor((size - logo.bitmap.height) / 2);
  canvas.composite(logo, x, y);
  await canvas.write(path.join(outDir, `paypulse-logo-${size}.png`));
}

console.log("generated transparent logo assets");
