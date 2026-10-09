import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createSolidPng(width, height, r, g, b, a = 255) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // create a subtle border and inner area
      const isBorder = x < 8 || x >= width - 8 || y < 8 || y >= height - 8;
      if (isBorder) {
        rawData[pixelOffset] = 217;     // gold accent
        rawData[pixelOffset + 1] = 119;
        rawData[pixelOffset + 2] = 6;
        rawData[pixelOffset + 3] = 255;
      } else {
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
        rawData[pixelOffset + 3] = a;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }

  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Deep navy blue #1e3a8a
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createSolidPng(192, 192, 30, 58, 138));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createSolidPng(512, 512, 30, 58, 138));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createSolidPng(512, 512, 30, 58, 138));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createSolidPng(180, 180, 30, 58, 138));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createSolidPng(32, 32, 30, 58, 138));

console.log('PWA icons created successfully in /public');
