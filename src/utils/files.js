const path = require("path");

/**
 * Extracts and returns the file extension (type) from a given URL.
 * @param {string} url - The URL or file path to extract the file type from.
 * @returns {string} The file extension (without the dot) in lowercase.
 */
const getFileType = (url) => {
  return path.extname(url).toLowerCase().substring(1);
};

/**
 * Determines if the file is gzipped by checking if the file extension is ".gz".
 * @param {string} url - The URL or file path to check.
 * @returns {boolean} True if the file has a ".gz" extension, otherwise false.
 */
const getIsGzipped = (url) => {
  return path.extname(url).toLowerCase() === ".gz";
};

module.exports = { getFileType, getIsGzipped };
