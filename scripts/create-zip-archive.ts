/**
 * Minimal ZIP archive creator using the STORE method (no compression).
 * Designed for small text files like skill distribution bundles.
 * No external dependencies — uses only Node.js Buffer APIs.
 */

interface ZipEntry {
  path: string;
  data: Uint8Array;
}

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const STORE_METHOD = 0;
const VERSION_NEEDED = 20;
const VERSION_MADE_BY = 20;

/** Compute CRC-32 checksum for a byte array. */
function computeCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Create a ZIP archive from an array of file entries.
 * Uses STORE method (no compression) which is ideal for small text files.
 */
export function createZipArchive(entries: ZipEntry[]): Uint8Array {
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const encodedPath = new TextEncoder().encode(entry.path);
    const crc = computeCrc32(entry.data);
    const size = entry.data.length;

    // Local file header: 30 bytes + filename + data
    const localHeader = Buffer.alloc(30 + encodedPath.length + size);
    localHeader.writeUInt32LE(LOCAL_FILE_HEADER_SIGNATURE, 0);
    localHeader.writeUInt16LE(VERSION_NEEDED, 4);
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(STORE_METHOD, 8);
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(size, 18); // compressed size
    localHeader.writeUInt32LE(size, 22); // uncompressed size
    localHeader.writeUInt16LE(encodedPath.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field length
    localHeader.set(encodedPath, 30);
    localHeader.set(entry.data, 30 + encodedPath.length);

    localHeaders.push(localHeader);

    // Central directory header: 46 bytes + filename
    const centralHeader = Buffer.alloc(46 + encodedPath.length);
    centralHeader.writeUInt32LE(CENTRAL_DIRECTORY_SIGNATURE, 0);
    centralHeader.writeUInt16LE(VERSION_MADE_BY, 4);
    centralHeader.writeUInt16LE(VERSION_NEEDED, 6);
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(STORE_METHOD, 10);
    centralHeader.writeUInt16LE(0, 12); // mod time
    centralHeader.writeUInt16LE(0, 14); // mod date
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(size, 20); // compressed size
    centralHeader.writeUInt32LE(size, 24); // uncompressed size
    centralHeader.writeUInt16LE(encodedPath.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra field length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk number start
    centralHeader.writeUInt16LE(0, 36); // internal attributes
    centralHeader.writeUInt32LE(0, 38); // external attributes
    centralHeader.writeUInt32LE(offset, 42); // local header offset
    centralHeader.set(encodedPath, 46);

    centralHeaders.push(centralHeader);
    offset += localHeader.length;
  }

  const centralDirectoryOffset = offset;
  const centralDirectorySize = centralHeaders.reduce((sum, header) => sum + header.length, 0);

  // End of central directory record: 22 bytes
  // Entry count fields are UInt16 (max 65,535). ZIP64 would be needed beyond that.
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(END_OF_CENTRAL_DIRECTORY_SIGNATURE, 0);
  endRecord.writeUInt16LE(0, 4); // disk number
  endRecord.writeUInt16LE(0, 6); // disk with central directory
  endRecord.writeUInt16LE(entries.length, 8); // entries on this disk
  endRecord.writeUInt16LE(entries.length, 10); // total entries
  endRecord.writeUInt32LE(centralDirectorySize, 12);
  endRecord.writeUInt32LE(centralDirectoryOffset, 16);
  endRecord.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, endRecord]);
}
