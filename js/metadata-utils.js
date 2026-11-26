(function (root) {
  function readUint24BE(view, offset) {
    return (
      (view.getUint8(offset) << 16) |
      (view.getUint8(offset + 1) << 8) |
      view.getUint8(offset + 2)
    );
  }

  function readSynchsafe32(view, offset) {
    return (
      ((view.getUint8(offset) & 0x7f) << 21) |
      ((view.getUint8(offset + 1) & 0x7f) << 14) |
      ((view.getUint8(offset + 2) & 0x7f) << 7) |
      (view.getUint8(offset + 3) & 0x7f)
    );
  }

  function readAscii(bytes, start, length) {
    let out = "";
    const end = Math.min(bytes.length, start + length);
    for (let i = start; i < end; i++) {
      const ch = bytes[i];
      if (ch === 0) break;
      out += String.fromCharCode(ch);
    }
    return out;
  }

  function stripNulls(str) {
    return str.replace(/\0+$/g, "").trim();
  }

  function decodeTextBytes(bytes, encodingByte) {
    if (!bytes || bytes.length === 0) return "";
    try {
      if (encodingByte === 0) {
        return stripNulls(new TextDecoder("latin1").decode(bytes));
      }
      if (encodingByte === 1) {
        if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
          return stripNulls(new TextDecoder("utf-16le").decode(bytes.subarray(2)));
        }
        if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
          return stripNulls(new TextDecoder("utf-16be").decode(bytes.subarray(2)));
        }
        return stripNulls(new TextDecoder("utf-16le").decode(bytes));
      }
      if (encodingByte === 2) {
        return stripNulls(new TextDecoder("utf-16be").decode(bytes));
      }
      return stripNulls(new TextDecoder("utf-8").decode(bytes));
    } catch {
      return stripNulls(readAscii(bytes, 0, bytes.length));
    }
  }

  function extractYear(raw) {
    if (!raw || typeof raw !== "string") return "";
    const match = /\b(19\d{2}|20\d{2})\b/.exec(raw);
    return match ? match[1] : "";
  }

  function findNullTerminator(bytes, start, encodingByte) {
    if (encodingByte === 1 || encodingByte === 2) {
      for (let i = start; i + 1 < bytes.length; i += 2) {
        if (bytes[i] === 0 && bytes[i + 1] === 0) {
          return i + 2;
        }
      }
      return bytes.length;
    }
    for (let i = start; i < bytes.length; i++) {
      if (bytes[i] === 0) {
        return i + 1;
      }
    }
    return bytes.length;
  }

  function parseId3v2Picture(frameBytes, isV22) {
    if (!frameBytes || frameBytes.length < 4) return null;
    const encoding = frameBytes[0];
    let offset = 1;
    let mime = "image/jpeg";

    if (isV22) {
      const fmt = readAscii(frameBytes, offset, 3).toUpperCase();
      offset += 3;
      mime = fmt === "PNG" ? "image/png" : "image/jpeg";
    } else {
      const mimeEnd = findNullTerminator(frameBytes, offset, 0);
      const rawMime = readAscii(frameBytes, offset, mimeEnd - offset - 1).trim();
      if (rawMime) {
        mime = rawMime.includes("/") ? rawMime : `image/${rawMime.toLowerCase()}`;
      }
      offset = mimeEnd;
    }

    if (offset >= frameBytes.length) return null;
    offset += 1; // picture type byte
    offset = findNullTerminator(frameBytes, offset, encoding);
    if (offset >= frameBytes.length) return null;

    const imageBytes = frameBytes.slice(offset);
    if (imageBytes.length === 0) return null;
    return { mime, data: imageBytes };
  }

  function parseId3v2(buffer) {
    if (buffer.byteLength < 10) return null;
    const bytes = new Uint8Array(buffer);
    if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
      return null;
    }

    const view = new DataView(buffer);
    const version = bytes[3];
    if (version < 2 || version > 4) return null;

    const flags = bytes[5];
    const tagSize = readSynchsafe32(view, 6);
    const tagEnd = Math.min(bytes.length, 10 + tagSize);
    let offset = 10;

    if ((flags & 0x40) !== 0 && version >= 3 && offset + 4 <= tagEnd) {
      const extSize =
        version === 4 ? readSynchsafe32(view, offset) : view.getUint32(offset, false);
      offset += version === 4 ? extSize : extSize + 4;
    }

    const result = { title: "", artist: "", album: "", year: "", picture: null };
    const isV22 = version === 2;
    const frameHeaderSize = isV22 ? 6 : 10;

    while (offset + frameHeaderSize <= tagEnd) {
      if (bytes[offset] === 0) break;

      const frameId = readAscii(bytes, offset, isV22 ? 3 : 4);
      const frameSize = isV22
        ? readUint24BE(view, offset + 3)
        : version === 4
          ? readSynchsafe32(view, offset + 4)
          : view.getUint32(offset + 4, false);

      offset += frameHeaderSize;
      if (frameSize <= 0 || offset + frameSize > tagEnd) {
        break;
      }

      const frameBytes = bytes.subarray(offset, offset + frameSize);
      offset += frameSize;

      if (frameId === "TIT2" || frameId === "TT2") {
        result.title = decodeTextBytes(frameBytes.subarray(1), frameBytes[0]) || result.title;
      } else if (frameId === "TPE1" || frameId === "TP1") {
        result.artist = decodeTextBytes(frameBytes.subarray(1), frameBytes[0]) || result.artist;
      } else if (frameId === "TALB" || frameId === "TAL") {
        result.album = decodeTextBytes(frameBytes.subarray(1), frameBytes[0]) || result.album;
      } else if (
        frameId === "TYER" ||
        frameId === "TDRC" ||
        frameId === "TYE"
      ) {
        const yr = extractYear(decodeTextBytes(frameBytes.subarray(1), frameBytes[0]));
        if (yr) result.year = yr;
      } else if ((frameId === "APIC" || frameId === "PIC") && !result.picture) {
        result.picture = parseId3v2Picture(frameBytes, isV22);
      }
    }

    return result;
  }

  function parseId3v1(buffer) {
    if (buffer.byteLength < 128) return null;
    const bytes = new Uint8Array(buffer, buffer.byteLength - 128, 128);
    if (readAscii(bytes, 0, 3) !== "TAG") return null;

    const decoder = new TextDecoder("latin1");
    const title = stripNulls(decoder.decode(bytes.subarray(3, 33)));
    const artist = stripNulls(decoder.decode(bytes.subarray(33, 63)));
    const album = stripNulls(decoder.decode(bytes.subarray(63, 93)));
    const year = extractYear(stripNulls(decoder.decode(bytes.subarray(93, 97))));

    return { title, artist, album, year, picture: null };
  }

  function parseMp4Atoms(buffer) {
    if (buffer.byteLength < 12) return null;
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    if (readAscii(bytes, 4, 4) !== "ftyp") return null;

    const result = { title: "", artist: "", album: "", year: "", picture: null };
    const CONTAINER_ATOMS = new Set(["moov", "udta", "meta", "ilst"]);

    function walk(start, end) {
      let pos = start;
      while (pos + 8 <= end) {
        const size = view.getUint32(pos, false);
        if (size < 8 || pos + size > end) break;
        const type = readAscii(bytes, pos + 4, 4);

        if (CONTAINER_ATOMS.has(type)) {
          const innerStart = type === "meta" ? pos + 12 : pos + 8;
          if (innerStart < pos + size) {
            walk(innerStart, pos + size);
          }
        } else if (
          type === "\xA9nam" ||
          type === "\xA9ART" ||
          type === "\xA9alb" ||
          type === "\xA9day" ||
          type === "covr"
        ) {
          let subPos = pos + 8;
          while (subPos + 8 <= pos + size) {
            const subSize = view.getUint32(subPos, false);
            if (subSize < 8 || subPos + subSize > pos + size) break;
            const subType = readAscii(bytes, subPos + 4, 4);
            if (subType === "data" && subSize > 16) {
              const dataType = view.getUint32(subPos + 8, false);
              const payload = bytes.subarray(subPos + 16, subPos + subSize);
              if (type === "covr" && !result.picture) {
                const mime = dataType === 14 ? "image/png" : "image/jpeg";
                result.picture = { mime, data: new Uint8Array(payload) };
              } else {
                const text = stripNulls(new TextDecoder("utf-8").decode(payload));
                if (type === "\xA9nam") result.title = text || result.title;
                if (type === "\xA9ART") result.artist = text || result.artist;
                if (type === "\xA9alb") result.album = text || result.album;
                if (type === "\xA9day") result.year = extractYear(text) || result.year;
              }
            }
            subPos += subSize;
          }
        }
        pos += size;
      }
    }

    walk(0, bytes.length);
    return result;
  }

  function parseRiffInfo(buffer) {
    if (buffer.byteLength < 12) return null;
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    if (readAscii(bytes, 0, 4) !== "RIFF" || readAscii(bytes, 8, 4) !== "WAVE") {
      return null;
    }

    const result = { title: "", artist: "", album: "", year: "", picture: null };
    let pos = 12;

    while (pos + 8 <= bytes.length) {
      const chunkId = readAscii(bytes, pos, 4);
      const chunkSize = view.getUint32(pos + 4, true);
      const dataStart = pos + 8;
      const dataEnd = Math.min(bytes.length, dataStart + chunkSize);

      if (chunkId === "LIST" && dataStart + 4 <= dataEnd) {
        const listType = readAscii(bytes, dataStart, 4);
        if (listType === "INFO") {
          let sub = dataStart + 4;
          while (sub + 8 <= dataEnd) {
            const subId = readAscii(bytes, sub, 4);
            const subSize = view.getUint32(sub + 4, true);
            const subStart = sub + 8;
            const subEnd = Math.min(dataEnd, subStart + subSize);
            const val = stripNulls(
              new TextDecoder("utf-8").decode(bytes.subarray(subStart, subEnd))
            );
            if (subId === "INAM") result.title = val || result.title;
            if (subId === "IART") result.artist = val || result.artist;
            if (subId === "IPRD") result.album = val || result.album;
            if (subId === "ICRD") result.year = extractYear(val) || result.year;
            sub = subStart + subSize + (subSize % 2);
          }
        }
      }

      pos = dataStart + chunkSize + (chunkSize % 2);
    }

    return result;
  }

  function cleanFilename(filename) {
    if (!filename || typeof filename !== "string") return "";
    return filename.replace(/\.[^/.]+$/, "");
  }

  function formatMetadataDetails(meta) {
    if (!meta) return "";
    const parts = [];
    if (meta.artist) parts.push(meta.artist);
    if (meta.album) parts.push(meta.album);
    if (meta.year) parts.push(meta.year);
    return parts.join(" · ");
  }

  function extractMediaMetadata(buffer, filename = "") {
    const empty = {
      title: "",
      artist: "",
      album: "",
      year: "",
      picture: null,
      hasTags: false,
      displayTitle: cleanFilename(filename) || filename || "Untitled",
    };

    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength === 0) {
      return empty;
    }

    const id3v2 = parseId3v2(buffer);
    const id3v1 = parseId3v1(buffer);
    let parsed;

    if (id3v2) {
      parsed = {
        title: id3v2.title || (id3v1 && id3v1.title) || "",
        artist: id3v2.artist || (id3v1 && id3v1.artist) || "",
        album: id3v2.album || (id3v1 && id3v1.album) || "",
        year: id3v2.year || (id3v1 && id3v1.year) || "",
        picture: id3v2.picture || null,
      };
    } else {
      parsed =
        parseMp4Atoms(buffer) ||
        parseRiffInfo(buffer) ||
        id3v1 ||
        {};
    }

    const title = parsed.title || "";
    const artist = parsed.artist || "";
    const album = parsed.album || "";
    const year = parsed.year || "";
    const picture = parsed.picture || null;
    const hasTags = Boolean(title || artist || album || year || picture);

    return {
      title,
      artist,
      album,
      year,
      picture,
      hasTags,
      displayTitle: title || empty.displayTitle,
    };
  }

  const api = {
    extractMediaMetadata,
    formatMetadataDetails,
    parseId3v2,
    parseId3v1,
    parseMp4Atoms,
    parseRiffInfo,
    cleanFilename,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.MetadataUtils = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
