const path = require('path');
const fs = require('fs').promises;
const typeMappingsPath = path.join(__dirname, '/handlers/typeMappings.json');

let cachedTypeMappings = null;

/**
 * Dynamically loads the file handler based on the file extension.
 * @param {string} extension - The file extension for which a handler is needed.
 * @returns {Promise<Object>} - A promise that resolves to the required handler module.
 *                              Falls back to the text handler if no specific handler is found.
 */
async function getFileHandler(extension) {
    try {
        if (!cachedTypeMappings) {
            const typeMappingsContent = await fs.readFile(typeMappingsPath, 'utf-8');
            cachedTypeMappings = JSON.parse(typeMappingsContent);
        }

        const handlerName = cachedTypeMappings[extension.toLowerCase()];

        if (handlerName) {
            return require(`./handlers/${handlerName}.js`);
        } else {
            return require('./handlers/textHandler.js');
        }
    } catch (err) {
        console.error(`Error loading handler for extension "${extension}": ${err.message}`);
        return require('./handlers/textHandler.js');
    }
}

module.exports = getFileHandler;
