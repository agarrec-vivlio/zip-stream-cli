const path = require('path');
const fs = require('fs');

// Function to dynamically load the handler based on the file extension
async function getFileHandler(extension) {
    try {
        // Read and parse the typeMappings JSON file
        const typeMappingsPath = path.join(__dirname, '/handlers/typeMappings.json');
        const typeMappings = JSON.parse(fs.readFileSync(typeMappingsPath, 'utf-8'));

        // Get the handler name based on the extension
        const handlerName = typeMappings[extension.toLowerCase()];
        if (handlerName) {
            const handler = await require(`./handlers/${handlerName}.js`);
            return handler;
        } else {
            // If no handler is found for the file type, fall back to the text handler
            return await require('./handlers/textHandler.js');
        }
    } catch (err) {
        console.error(`Error loading handler for ${extension}:`, err.message);
        return await require('./handlers/textHandler.js');  // Default to text handler in case of error
    }
}

module.exports = getFileHandler 
