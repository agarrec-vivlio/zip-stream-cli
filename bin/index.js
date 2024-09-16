#!/usr/bin/env node

const inquirer = require("inquirer");
const path = require("path");
const validUrl = require("valid-url");
const getFileService = require("../src/utils/fileProcessor");

// Determine the file type based on the URL extension
const getFileType = (url) => {
  return path.extname(url).toLowerCase().substring(1);
};

// List files and let the user select one
const listAndSelectFile = async (files) => {
  const choices = files.map((file) => ({
    name: `${file.filename} (${file.fileSize || "unknown"} bytes)`,
    value: file,
  }));

  if (!choices.length) {
    console.log("No files found in the archive.");
    process.exit(0);
  }

  const { selectedFile } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedFile",
      message: "Select a file to display or process:",
      choices,
    },
  ]);

  return selectedFile;
};

// Main script entry point
const main = async () => {
  try {
    const [url] = process.argv.slice(2);
    if (!url || !validUrl.isWebUri(url)) {
      console.error("Usage: <url>");
      process.exit(1);
    }

    const fileType = getFileType(url);

    // Dynamically load the service based on the file extension
    const fileService = await getFileService(fileType);

    const files = await fileService.listFiles(url);

    const selectedFile = await listAndSelectFile(files);

    if (fileService.processFile) {
      await fileService.processFile(selectedFile, url);
    }
  } catch (error) {
    console.error("An error occurred during processing:", error);
    process.exit(1);
  }
};

main();
