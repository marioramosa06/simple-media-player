const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "public");

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const entriesToCopy = [
  "index.html",
  "manifest.json",
  "sw.js",
  "css",
  "js",
  "images",
];

for (const entry of entriesToCopy) {
  const src = path.join(rootDir, entry);
  const dest = path.join(outDir, entry);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
}

console.log("Built static assets into public/");
