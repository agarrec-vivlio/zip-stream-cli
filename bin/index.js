#!/usr/bin/env node

const inquirer = require("inquirer");
const validUrl = require("valid-url");
const getFileService = require("../src/utils/fileProcessor");
const { getFileType } = require("../src/utils/files");

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

const main = async () => {
  try {
    const [url] = process.argv.slice(2);

    if (!url || !validUrl.isWebUri(url)) {
      console.error("Usage: <url>");
      process.exit(1);
    }

    const fileType = getFileType(url);

    const fileService = await getFileService(fileType);

    const files = await fileService.listFiles(url);

    const selectedFile = await listAndSelectFile(files);

    await fileService.processFile(selectedFile, url);
    //
  } catch (error) {
    console.error("An error occurred during processing:", error);
    process.exit(1);
  }
};

main();
