import { describe, it, expect } from 'vitest';
import { createZipArchive } from './create-zip-archive';

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;

const encoder = new TextEncoder();

function readUint32LE(buffer: Uint8Array, offset: number): number {
  return (
    buffer[offset] |
    (buffer[offset + 1] << 8) |
    (buffer[offset + 2] << 16) |
    ((buffer[offset + 3] << 24) >>> 0)
  );
}

function readUint16LE(buffer: Uint8Array, offset: number): number {
  return buffer[offset] | (buffer[offset + 1] << 8);
}

/** Find the offset where the end-of-central-directory record begins. */
function findEndOfCentralDirectory(archive: Uint8Array): number {
  // The EOCD is always the last 22 bytes when there is no ZIP comment.
  const offset = archive.length - 22;
  const signature = readUint32LE(archive, offset);

  if (signature !== END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
    throw new Error('End-of-central-directory signature not found at expected offset');
  }

  return offset;
}

function makeEntry(path: string, content: string) {
  return { path, data: encoder.encode(content) };
}

describe('createZipArchive', () => {
  it('starts with the local file header signature', () => {
    const archive = createZipArchive([makeEntry('hello.txt', 'hello')]);
    const signature = readUint32LE(archive, 0);

    expect(signature).toBe(LOCAL_FILE_HEADER_SIGNATURE);
  });

  it('ends with the end-of-central-directory signature', () => {
    const archive = createZipArchive([makeEntry('hello.txt', 'hello')]);
    const endOffset = findEndOfCentralDirectory(archive);
    const signature = readUint32LE(archive, endOffset);

    expect(signature).toBe(END_OF_CENTRAL_DIRECTORY_SIGNATURE);
  });

  it('creates a valid archive with a single text file entry', () => {
    const content = 'hello world';
    const archive = createZipArchive([makeEntry('greeting.txt', content)]);

    // The file data should appear verbatim in the archive (STORE method, no compression).
    const contentBytes = encoder.encode(content);
    const archiveString = Buffer.from(archive).toString('binary');
    const contentString = Buffer.from(contentBytes).toString('binary');

    expect(archiveString).toContain(contentString);
  });

  it('records the correct entry count for multiple entries', () => {
    const entries = [
      makeEntry('one.txt', 'first'),
      makeEntry('two.txt', 'second'),
      makeEntry('three.txt', 'third'),
    ];

    const archive = createZipArchive(entries);
    const endOffset = findEndOfCentralDirectory(archive);

    // Bytes 8-9: number of entries on this disk.
    const entriesOnDisk = readUint16LE(archive, endOffset + 8);
    // Bytes 10-11: total number of entries.
    const totalEntries = readUint16LE(archive, endOffset + 10);

    expect(entriesOnDisk).toBe(3);
    expect(totalEntries).toBe(3);
  });

  it('produces a valid archive when given an empty entries array', () => {
    const archive = createZipArchive([]);
    const endOffset = findEndOfCentralDirectory(archive);

    // With no entries, the archive should be exactly the 22-byte EOCD record.
    expect(archive.length).toBe(22);

    const signature = readUint32LE(archive, endOffset);
    expect(signature).toBe(END_OF_CENTRAL_DIRECTORY_SIGNATURE);

    const totalEntries = readUint16LE(archive, endOffset + 10);
    expect(totalEntries).toBe(0);
  });

  it('encodes file paths correctly in the local file header', () => {
    const filePath = 'src/components/button.svelte';
    const archive = createZipArchive([makeEntry(filePath, '<button>Click</button>')]);

    // The file path appears right after the 30-byte local file header.
    const pathLength = readUint16LE(archive, 26);
    const encodedPath = Buffer.from(archive.slice(30, 30 + pathLength)).toString('utf-8');

    expect(encodedPath).toBe(filePath);
  });

  it('stores the correct CRC-32 checksum in the local file header', () => {
    const archive = createZipArchive([makeEntry('hello.txt', 'hello')]);

    // CRC-32 of "hello" is 0x3610a686.
    const crc = readUint32LE(archive, 14);
    expect(crc).toBe(0x3610a686);
  });

  it('encodes file paths correctly in the central directory header', () => {
    const filePath = 'nested/directory/file.json';
    const content = '{"key": "value"}';
    const archive = createZipArchive([makeEntry(filePath, content)]);

    // Find the central directory by scanning for its signature after local headers.
    const endOffset = findEndOfCentralDirectory(archive);
    const centralDirectoryOffset = readUint32LE(archive, endOffset + 16);
    const centralSignature = readUint32LE(archive, centralDirectoryOffset);

    expect(centralSignature).toBe(CENTRAL_DIRECTORY_SIGNATURE);

    // The path length is at offset 28 in the central directory header.
    const pathLength = readUint16LE(archive, centralDirectoryOffset + 28);
    // The path starts at offset 46 in the central directory header.
    const encodedPath = Buffer.from(
      archive.slice(centralDirectoryOffset + 46, centralDirectoryOffset + 46 + pathLength),
    ).toString('utf-8');

    expect(encodedPath).toBe(filePath);
  });
});
