#!/usr/bin/env node

const { createRemoteZipFile } = require('../src/RemoteZipFile');
const inquirer = require('inquirer');
const path = require('path');
const validUrl = require('valid-url');

// Function to list files in the ZIP and let the user select one
async function listAndSelectFile(zipFile, zipSize) {
    try {
        const files = await zipFile.listFiles(zipSize);

        const choices = files
            .filter(file => !file.isDir()) // Exclude directories
            .map(file => ({
                name: `${file.filename} (${file.fileSize} bytes)`,
                value: file
            }));

        if (choices.length === 0) {
            console.log("No files found in the ZIP archive.");
            process.exit(0);
        }

        const { selectedFile } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedFile',
                message: 'Select a file to display or process:',
                choices
            }
        ]);

        return selectedFile;
    } catch (error) {
        console.error('Error listing or selecting files:', error);
        process.exit(1);
    }
}

// Main function to handle the selected file
async function processSelectedFile(zipFile, selectedFile) {
    try {
        // Pass the selected file to the appropriate handler
        await zipFile.handleFile(selectedFile);
    } catch (error) {
        console.error('Error displaying or processing file content:', error);
    }
}

// Main entry point for the script
async function main() {
    try {
        const [url] = process.argv.slice(2);

        if (!url) {
            console.error('Usage: <url>');
            process.exit(1);
        }

        if (!validUrl.isWebUri(url)) {
            console.error('Invalid URL. Please provide a valid URL to a remote ZIP file.');
            process.exit(1);
        }

        const zipFile = createRemoteZipFile(url);

        const zipSize = await zipFile.fetchHead();

        // List files in the ZIP and allow the user to select one
        const selectedFile = await listAndSelectFile(zipFile, zipSize);

        // Process the selected file (with the appropriate handler)
        await processSelectedFile(zipFile, selectedFile);
    } catch (error) {
        console.error('An error occurred during processing:', error);
        process.exit(1);
    }
}

main();
