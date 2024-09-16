const path = require("path");
const fs = require("fs").promises;
const serviceMappingsPath = path.join(__dirname, "../config/serviceMappings.json");

let cachedServiceMappings = null;

/**
 * Load the appropriate service based on the file extension.
 * @param {string} extension - The file extension (e.g., "zip", "rar").
 * @returns {Promise<Object>} - The loaded service module.
 */
const getFileService = async (extension) => {
  if (!extension || typeof extension !== "string") {
    throw new Error("Invalid file extension.");
  }

  const normalizedExtension = extension.toLowerCase().trim();

  try {
    // Load the service mappings from the config file
    if (!cachedServiceMappings) {
      const serviceMappingsContent = await fs.readFile(serviceMappingsPath, "utf-8");
      cachedServiceMappings = JSON.parse(serviceMappingsContent);
    }

    // Dynamically require the service based on the file extension
    const serviceName = cachedServiceMappings[normalizedExtension];
    if (!serviceName) {
      throw new Error(`No service found for the file extension: ${normalizedExtension}`);
    }

    return require(`../services/${serviceName}.js`);
  } catch (err) {
    console.error(`Error loading service for extension "${normalizedExtension}": ${err.message}`);
    throw err;
  }
};

module.exports = getFileService;
