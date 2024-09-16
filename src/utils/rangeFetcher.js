const fetch = require("node-fetch");

/**
 * Fetches a specific byte range from a given URL.
 * @param {string} url - The URL to fetch the byte range from.
 * @param {number} start - The start byte position of the range.
 * @param {number} end - The end byte position of the range.
 * @returns {Promise<stream.Readable>} - A promise that resolves with the fetched byte range as a stream.
 * @throws {Error} - Throws an error if the fetch request fails.
 */
const fetchByteRange = async (url, start, end) => {
  const response = await fetch(url, {
    headers: { Range: `bytes=${start}-${end}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch range ${start}-${end}`);
  }

  return response.body;
};

/**
 * Fetches a specific byte range as a Buffer.
 * @param {string} url - The URL to fetch the byte range from.
 * @param {number} start - The start byte position of the range.
 * @param {number} length - The length of the byte range to fetch.
 * @returns {Promise<Buffer>} - A promise that resolves with the fetched byte range as a Buffer.
 */
const getRange = async (url, start, length) => {
  const response = await fetch(url, {
    headers: { Range: `bytes=${start}-${start + length - 1}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch range ${start}-${start + length - 1}`);
  }

  return Buffer.from(await response.arrayBuffer());
};

module.exports = { fetchByteRange, getRange };
