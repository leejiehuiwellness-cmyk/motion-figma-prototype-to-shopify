import { writeFileSync, mkdirSync } from "node:fs";
import zlib from "node:zlib";

mkdirSync("marketplace-assets", { recursive: true });

writeFileSync("marketplace-assets/icon.png", createIconPng());
writeFileSync("marketplace-assets/cover.png", createCoverPng());
console.log("Generated marketplace-assets/icon.png and marketplace-assets/cover.png");

function createIconPng() {
  const image = createImage(128, 128, [15, 23, 42, 255]);
  fillCircle(image, 38, 33, 14, [255, 114, 98, 255]);
  fillCircle(image, 38, 64, 14, [162, 89, 255, 255]);
  fillCircle(image, 38, 95, 14, [26, 188, 254, 255]);
  fillRoundRect(image, 62, 31, 42, 62, 8, [149, 191, 71, 255]);
  strokeArc(image, 83, 49, 14, Math.PI, Math.PI * 2, 5, [255, 255, 255, 255]);
  strokeLine(image, 50, 64, 88, 64, 5, [255, 255, 255, 255]);
  strokeLine(image, 78, 54, 94, 64, 5, [255, 255, 255, 255]);
  strokeLine(image, 78, 74, 94, 64, 5, [255, 255, 255, 255]);
  return encodePng(image);
}

function createCoverPng() {
  const image = createImage(1920, 1080, [248, 250, 252, 255]);
  fillRoundRect(image, 88, 88, 1744, 904, 48, [15, 23, 42, 255]);
  fillRoundRect(image, 154, 154, 620, 720, 28, [255, 255, 255, 255]);
  fillRoundRect(image, 216, 226, 248, 36, 18, [17, 24, 39, 255]);
  fillRoundRect(image, 216, 306, 450, 22, 11, [203, 213, 225, 255]);
  fillRoundRect(image, 216, 352, 390, 22, 11, [203, 213, 225, 255]);
  fillRoundRect(image, 216, 428, 490, 230, 24, [226, 232, 240, 255]);
  fillCircle(image, 276, 748, 28, [255, 114, 98, 255]);
  fillCircle(image, 350, 748, 28, [162, 89, 255, 255]);
  fillCircle(image, 424, 748, 28, [26, 188, 254, 255]);
  strokeLine(image, 822, 540, 1114, 540, 22, [149, 191, 71, 255]);
  strokeLine(image, 1062, 482, 1138, 540, 22, [149, 191, 71, 255]);
  strokeLine(image, 1062, 598, 1138, 540, 22, [149, 191, 71, 255]);
  fillRoundRect(image, 1196, 154, 570, 720, 28, [255, 255, 255, 255]);
  fillRoundRect(image, 1264, 230, 330, 42, 20, [17, 24, 39, 255]);
  fillRoundRect(image, 1264, 306, 420, 24, 12, [71, 85, 105, 255]);
  fillRoundRect(image, 1264, 396, 390, 24, 12, [203, 213, 225, 255]);
  fillRoundRect(image, 1264, 454, 430, 24, 12, [203, 213, 225, 255]);
  fillRoundRect(image, 1264, 512, 350, 24, 12, [203, 213, 225, 255]);
  fillRoundRect(image, 1264, 644, 270, 70, 14, [149, 191, 71, 255]);
  fillRoundRect(image, 154, 922, 580, 32, 16, [255, 255, 255, 255]);
  fillRoundRect(image, 154, 970, 790, 20, 10, [203, 213, 225, 255]);
  return encodePng(image);
}

function createImage(width, height, color) {
  const data = new Uint8Array(width * height * 4);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = color[0];
    data[index + 1] = color[1];
    data[index + 2] = color[2];
    data[index + 3] = color[3];
  }
  return { width, height, data };
}

function fillRoundRect(image, x, y, width, height, radius, color) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      const cx = xx < x + radius ? x + radius : xx >= x + width - radius ? x + width - radius - 1 : xx;
      const cy = yy < y + radius ? y + radius : yy >= y + height - radius ? y + height - radius - 1 : yy;
      const dx = xx - cx;
      const dy = yy - cy;
      if (dx * dx + dy * dy <= radius * radius) setPixel(image, xx, yy, color);
    }
  }
}

function fillCircle(image, cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) setPixel(image, x, y, color);
    }
  }
}

function strokeLine(image, x1, y1, x2, y2, width, color) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    fillCircle(image, Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t), Math.ceil(width / 2), color);
  }
}

function strokeArc(image, cx, cy, radius, start, end, width, color) {
  const steps = Math.ceil(radius * Math.abs(end - start) * 2);
  for (let i = 0; i <= steps; i += 1) {
    const t = start + ((end - start) * i) / steps;
    fillCircle(image, Math.round(cx + Math.cos(t) * radius), Math.round(cy + Math.sin(t) * radius), Math.ceil(width / 2), color);
  }
}

function setPixel(image, x, y, color) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  const index = (y * image.width + x) * 4;
  image.data[index] = color[0];
  image.data[index + 1] = color[1];
  image.data[index + 2] = color[2];
  image.data[index + 3] = color[3];
}

function encodePng(image) {
  const rows = [];
  for (let y = 0; y < image.height; y += 1) {
    const row = new Uint8Array(1 + image.width * 4);
    row[0] = 0;
    row.set(image.data.subarray(y * image.width * 4, (y + 1) * image.width * 4), 1);
    rows.push(row);
  }
  const raw = concat(rows);
  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", concat([u32be(image.width), u32be(image.height), Buffer.from([8, 6, 0, 0, 0])])),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  return Buffer.concat([u32be(data.length), typeBuffer, data, u32be(crc32(Buffer.concat([typeBuffer, data])))]);
}

function u32be(value) {
  const out = Buffer.alloc(4);
  out.writeUInt32BE(value >>> 0, 0);
  return out;
}

function concat(parts) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return Buffer.from(out);
}

function crc32(data) {
  const table = crc32.table || (crc32.table = makeCrcTable());
  let crc = -1;
  for (let i = 0; i < data.length; i += 1) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeCrcTable() {
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}
