const path = require('path');
const fs = require('fs').promises;  // Use promise-based fs methods for async operations
const typeMappingsPath = path.join(__dirname, '/handlers/typeMappings.json');

let cachedTypeMappings = null;  // Cache to store type mappings after the first load

// Function to dynamically load the handler based on the file extension
async function getFileHandler(extension) {
    try {
        // Check if the mappings are already cached
        if (!cachedTypeMappings) {
            const typeMappingsContent = await fs.readFile(typeMappingsPath, 'utf-8');
            cachedTypeMappings = JSON.parse(typeMappingsContent);
        }

        // Get the handler name based on the extension
        const handlerName = cachedTypeMappings[extension.toLowerCase()];

        if (handlerName) {
            // Load handler dynamically
            return require(`./handlers/${handlerName}.js`);
        } else {
            // Fallback to text handler if no specific handler is found
            return require('./handlers/textHandler.js');
        }
    } catch (err) {
        console.error(`Error loading handler for extension "${extension}": ${err.message}`);
        // Return fallback text handler in case of any error
        return require('./handlers/textHandler.js');
    }
}

module.exports = getFileHandler;
