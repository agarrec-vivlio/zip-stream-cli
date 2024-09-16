const zlib = require("zlib");
const tar = require("tar-stream");
const stream = require("stream");
const path = require("path");
const getFileHandler = require("../utils/fileHandler");
const { fetchByteRange } = require("../utils/rangeFetcher");
const { getIsGzipped } = require("../utils/files");

/**
 * Handles a .tar or .tar.gz (gzip) file by extracting and processing the specified file.
 * @param {Object} selectedFile - The file to be extracted.
 * @param {boolean} isGzipped - Indicates if the file is gzipped.
 * @param {string} url - The URL of the archive.
 * @returns {Promise<void>} - A promise that resolves when the file is processed.
 */
const processFile = async (selectedFile, url) => {
  return new Promise(async (resolve, reject) => {
    try {
      const isGzipped = getIsGzipped(url);

      const extract = tar.extract();
      let fileFound = false;

      extract.on("entry", (header, entryStream, next) => {
        if (fileFound) {
          entryStream.resume();
          return next();
        }

        const isDirectory = header.type === "directory";
        if (header.name !== selectedFile.filename || isDirectory) {
          entryStream.resume();
          return next();
        }

        fileFound = true;
        const chunks = [];
        entryStream.on("data", (chunk) => chunks.push(chunk));

        entryStream.on("end", async () => {
          try {
            const fileContent = Buffer.concat(chunks);
            const handler = await getFileHandler(path.extname(header.name).substring(1));

            const contentStream = stream.Readable.from(fileContent);
            await handler(contentStream);
            next();
          } catch (error) {
            console.error(`Error processing ${header.name}:`, error);
            next();
          }
        });

        entryStream.resume();
      });

      extract.on("error", (err) => {
        console.error("Error in TAR extraction:", err);
        reject(err);
      });

      extract.on("finish", () => {
        if (!fileFound) {
          reject(new Error(`File ${selectedFile} not found in the archive.`));
        } else {
          resolve();
        }
      });

      let tarStream;
      if (isGzipped) {
        const gzStream = await fetchByteRange(url, 0, 2000000);
        tarStream = gzStream.pipe(zlib.createGunzip());
      } else {
        tarStream = await fetchByteRange(url, 0, 2000000);
      }

      tarStream.pipe(extract);
    } catch (err) {
      console.error("Error handling tar file:", err);
      reject(err);
    }
  });
};

/**
 * Lists the files in a .tar or .tar.gz archive without fetching the entire stream.
 * @param {string} url - The URL of the archive.
 * @returns {Promise<Object[]>} - A promise that resolves with an array of file information.
 */
const listFiles = async (url) => {
  return new Promise(async (resolve, reject) => {
    const isGzipped = getIsGzipped(url);

    const files = [];
    const extract = tar.extract();

    extract.on("entry", (header, entryStream, next) => {
      const isDirectory = header.type === "directory";
      const fileInfo = {
        filename: header.name,
        fileSize: header.size,
        isDir: isDirectory,
      };
      files.push(fileInfo);

      entryStream.on("end", next);
      entryStream.resume();
    });

    extract.on("finish", () => {
      resolve(files);
    });

    extract.on("error", (err) => {
      reject(err);
    });

    let tarStream;
    if (isGzipped) {
      const gzStream = await fetchByteRange(url, 0, 2000000);
      tarStream = gzStream.pipe(zlib.createGunzip());
    } else {
      tarStream = await fetchByteRange(url, 0, 2000000);
    }

    tarStream.pipe(extract);
  });
};

module.exports = { processFile, listFiles };
