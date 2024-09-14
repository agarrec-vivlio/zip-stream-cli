const fetch = require('node-fetch');

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
