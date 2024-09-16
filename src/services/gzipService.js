// WIP
const zlib = require("zlib");
const stream = require("stream");
const path = require("path");
const fetch = require("node-fetch");
const { fetchByteRange } = require("../utils/rangeFetcher");
const getFileHandler = require("../utils/fileHandler");

/**
 * Extracts the original filename from the GZIP header if it exists.
 * @param {Buffer} gzipHeader - The GZIP header buffer.
 * @returns {string} - The original filename or 'unknown' if not present.
 */
const extractGzipFilename = (gzipHeader) => {
  const FNAME_FLAG = 0x08; // The flag that indicates the presence of the original filename

  // Check if the FNAME flag is set (indicating that the original filename is included)
  if (gzipHeader[3] & FNAME_FLAG) {
    let offset = 10; // Filename starts after the 10-byte GZIP header
    let filename = "";

    // Iterate through the bytes after the header until we find a null terminator (0x00)
    while (gzipHeader[offset] !== 0x00 && offset < gzipHeader.length) {
      filename += String.fromCharCode(gzipHeader[offset]);
      offset++;
    }

    return filename || "unknown"; // Return the filename if found
  }

  return "unknown"; // Return 'unknown' if the FNAME flag is not set
};

/**
 * Lists files from a GZIP file. GZIP is typically used to compress a single file.
 * @param {string} url - The URL of the GZIP file.
 * @returns {Promise<Object[]>} - A promise that resolves with an array of file information.
 */
const listFiles = async (url) => {
  try {
    const headResponse = await fetch(url, { method: "HEAD" });
    const contentLength = headResponse.headers.get("content-length");

    const gzipHeader = await fetchByteRange(url, 0, 100);
    const filename = extractGzipFilename(gzipHeader);

    const fileInfo = createGzipFileInfo(filename, contentLength);
    return [fileInfo];
  } catch (error) {
    console.error("Error listing files from GZIP:", error);
    throw error;
  }
};

/**
 * Creates an object containing information about a GZIP file entry.
 * @param {string} filename - The name of the file in the GZIP archive.
 * @param {number} fileSize - The compressed size of the file.
 * @returns {Object} - An object containing file information and metadata.
 */
const createGzipFileInfo = (filename, fileSize) => {
  return {
    filename,
    fileSize,
    isDir: () => false, // GZIP typically compresses a single file, not directories
  };
};

/**
 * Opens a GZIP file, decompresses it, and processes it using the appropriate handler.
 * @param {Object} file - The file information object.
 * @param {string} url - The URL of the GZIP file.
 * @returns {Promise<void>} - A promise that resolves when the file is processed.
 */
const processFile = async (file, url) => {
  try {
    const compressedStream = await fetchByteRange(url, 0, 2000000);
    const decompressedStream = compressedStream.pipe(zlib.createGunzip()); // Decompress the stream

    const handler = await getFileHandler(path.extname(file.filename).substring(1)); // Get the handler based on the file extension

    if (handler) {
      await handler(decompressedStream); // Pass the decompressed stream to the handler
    } else {
      console.error(`No handler found for file: ${file.filename}`);
    }
  } catch (error) {
    console.error(`Error processing GZIP file entry: ${file.filename}`, error);
    throw error;
  }
};

module.exports = { listFiles, processFile };
