const fetch = require('node-fetch');

/**
 * Fetches a specific byte range from a given URL.
 * @param {string} url - The URL to fetch the byte range from.
 * @param {number} start - The start byte position of the range.
 * @param {number} length - The length of the byte range to fetch.
 * @returns {Promise<Buffer>} - A promise that resolves with the fetched byte range as a Buffer.
 * @throws {Error} - Throws an error if the fetch request fails.
 */
const getRange = async (url, start, length) => {
    const response = await fetch(url, {
        headers: { 'Range': `bytes=${start}-${start + length - 1}` }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch range ${start}-${start + length - 1}`);
    }

    return Buffer.from(await response.arrayBuffer());
};

module.exports = { getRange };
