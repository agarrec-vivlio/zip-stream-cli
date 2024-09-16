const path = require("path");
const fs = require("fs").promises;
const typeMappingsPath = path.join(__dirname, "/../config/typeMappings.json");

/**
 * Loads the handler module without caching.
 * @param {string} handlerName - The name of the handler file (without extension).
 * @returns {Promise<Object>} - The loaded handler module.
 */
async function loadHandler(handlerName) {
  try {
    const handler = require(`../handlers/${handlerName}.js`);
    return handler;
  } catch (err) {
    console.error(`Error loading handler "${handlerName}": ${err.message}`);
    throw err;
  }
}

/**
 * Loads the file type mappings from the JSON file without caching.
 * @returns {Promise<Object>} - The parsed JSON object containing the type mappings.
 */
async function loadTypeMappings() {
  try {
    const typeMappingsContent = await fs.readFile(typeMappingsPath, "utf-8");
    return JSON.parse(typeMappingsContent);
  } catch (err) {
    console.error(`Error loading type mappings: ${err.message}`);
    throw err;
  }
}

/**
 * Dynamically loads the file handler based on the file extension.
 * This system is extensible to support new file types.
 *
 * Steps to Add a New File Type:
 * - Create a handler for the new file type in the "handlers" folder.
 * - Map the file extension to the handler in "typeMappings.json".
 *
 * @param {string} extension - The file extension (e.g., "txt", "custom").
 * @returns {Promise<Object>} - The loaded handler module.
 */
async function getFileHandler(extension) {
  if (!extension || typeof extension !== "string") {
    throw new Error("Invalid file extension.");
  }

  const normalizedExtension = extension.toLowerCase().trim();

  try {
    const typeMappings = await loadTypeMappings();

    const handlerName = typeMappings[normalizedExtension] || "textHandler";
    return await loadHandler(handlerName);
  } catch (err) {
    console.error(`Error finding handler for extension "${normalizedExtension}": ${err.message}`);
    return await loadHandler("textHandler");
  }
}

module.exports = getFileHandler;
