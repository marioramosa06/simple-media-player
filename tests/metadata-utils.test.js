const test = require("node:test");
const assert = require("node:assert/strict");
const {
  extractMediaMetadata,
  formatMetadataDetails,
} = require("../js/metadata-utils.js");

function makeId3v23Tag(frames) {
  const frameBuffers = frames.map(({ id, payload }) => {
    const header = Buffer.alloc(10);
    header.write(id, 0, 4, "ascii");
    header.writeUInt32BE(payload.length, 4);
    return Buffer.concat([header, payload]);
  });
  const body = Buffer.concat(frameBuffers);
  const size = body.length;
  const header = Buffer.alloc(10);
  header.write("ID3", 0, 3, "ascii");
  header[3] = 3; // ID3v2.3
  header[4] = 0;
  header[5] = 0;
  header[6] = (size >> 21) & 0x7f;
  header[7] = (size >> 14) & 0x7f;
  header[8] = (size >> 7) & 0x7f;
  header[9] = size & 0x7f;
  return Buffer.concat([header, body]);
}

function makeTextPayload(text) {
  return Buffer.concat([Buffer.from([0x03]), Buffer.from(text, "utf8")]);
}

test("extractMediaMetadata parses ID3v2.3 text tags and APIC album art", () => {
  const pngStub = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const apicPayload = Buffer.concat([
    Buffer.from([0x00]),
    Buffer.from("image/png\0", "ascii"),
    Buffer.from([0x03]),
    Buffer.from("Cover\0", "ascii"),
    pngStub,
  ]);

  const id3 = makeId3v23Tag([
    { id: "TIT2", payload: makeTextPayload("Midnight Echo") },
    { id: "TPE1", payload: makeTextPayload("Tana Collective") },
    { id: "TALB", payload: makeTextPayload("Island Sessions") },
    { id: "TYER", payload: makeTextPayload("2024") },
    { id: "APIC", payload: apicPayload },
  ]);

  const ab = id3.buffer.slice(id3.byteOffset, id3.byteOffset + id3.byteLength);
  const meta = extractMediaMetadata(ab, "01-midnight.mp3");

  assert.equal(meta.title, "Midnight Echo");
  assert.equal(meta.displayTitle, "Midnight Echo");
  assert.equal(meta.artist, "Tana Collective");
  assert.equal(meta.album, "Island Sessions");
  assert.equal(meta.year, "2024");
  assert.equal(meta.hasTags, true);
  assert.equal(meta.picture.mime, "image/png");
  assert.deepEqual(Buffer.from(meta.picture.data), pngStub);
  assert.equal(
    formatMetadataDetails(meta),
    "Tana Collective · Island Sessions · 2024"
  );
});

test("extractMediaMetadata parses ID3v1 footer tags and fills missing ID3v2 fields", () => {
  const id3 = makeId3v23Tag([
    { id: "TIT2", payload: makeTextPayload("Coastal Breeze v2") },
  ]);
  const footer = Buffer.alloc(128, 0);
  footer.write("TAG", 0, 3, "ascii");
  footer.write("Coastal Breeze", 3, 30, "latin1");
  footer.write("Mario", 33, 30, "latin1");
  footer.write("Demo EP", 63, 30, "latin1");
  footer.write("2022", 93, 4, "latin1");

  const full = Buffer.concat([id3, Buffer.alloc(64, 0), footer]);
  const ab = full.buffer.slice(full.byteOffset, full.byteOffset + full.byteLength);
  const meta = extractMediaMetadata(ab, "coastal.mp3");

  assert.equal(meta.title, "Coastal Breeze v2");
  assert.equal(meta.artist, "Mario");
  assert.equal(meta.album, "Demo EP");
  assert.equal(meta.year, "2022");
  assert.equal(meta.hasTags, true);
});

test("extractMediaMetadata parses WAV RIFF LIST/INFO metadata", () => {
  const infoSubChunks = Buffer.concat([
    Buffer.from("INAM"),
    Buffer.from([10, 0, 0, 0]),
    Buffer.from("Warm Tone\0"),
    Buffer.from("IART"),
    Buffer.from([12, 0, 0, 0]),
    Buffer.from("Synth Maker\0"),
    Buffer.from("ICRD"),
    Buffer.from([5, 0, 0, 0]),
    Buffer.from("2025\0\0"),
  ]);
  const listHeader = Buffer.alloc(12);
  listHeader.write("LIST", 0, 4, "ascii");
  listHeader.writeUInt32LE(4 + infoSubChunks.length, 4);
  listHeader.write("INFO", 8, 4, "ascii");

  const riff = Buffer.alloc(12);
  riff.write("RIFF", 0, 4, "ascii");
  riff.writeUInt32LE(4 + listHeader.length + infoSubChunks.length, 4);
  riff.write("WAVE", 8, 4, "ascii");

  const full = Buffer.concat([riff, listHeader, infoSubChunks]);
  const ab = full.buffer.slice(full.byteOffset, full.byteOffset + full.byteLength);
  const meta = extractMediaMetadata(ab, "tone.wav");

  assert.equal(meta.title, "Warm Tone");
  assert.equal(meta.artist, "Synth Maker");
  assert.equal(meta.year, "2025");
  assert.equal(meta.hasTags, true);
  assert.equal(formatMetadataDetails(meta), "Synth Maker · 2025");
});

test("extractMediaMetadata falls back cleanly when no tags exist", () => {
  const emptyBuf = new Uint8Array([1, 2, 3, 4]).buffer;
  const meta = extractMediaMetadata(emptyBuf, "sample-clip.webm");

  assert.equal(meta.hasTags, false);
  assert.equal(meta.title, "");
  assert.equal(meta.artist, "");
  assert.equal(meta.year, "");
  assert.equal(meta.picture, null);
  assert.equal(meta.displayTitle, "sample-clip");
  assert.equal(formatMetadataDetails(meta), "");
});
