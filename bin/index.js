#!/usr/bin/env node

const { listZipFiles, openZipFile } = require('../src/handleZipFile');
const { handleTarFile, listTarFiles } = require('../src/handleTarFile');
const inquirer = require('inquirer');
const path = require('path');
const validUrl = require('valid-url');
const fetch = require('node-fetch');

// Determine the file type based on the URL extension
const getFileType = (url) => {
    const ext = path.extname(url).toLowerCase();
    if (ext === '.zip') return 'zip';
    if (ext === '.tar' || ext === '.gz') return 'tar';
    throw new Error('Unsupported file type. Only .zip, .tar, and .tar.gz are supported.');
};

// List files and let the user select one
const listAndSelectFile = async (files) => {
    const choices = files.map(file => ({
        name: `${file.filename} (${file.fileSize || 'unknown'} bytes)`,
        value: file
    }));

    if (!choices.length) {
        console.log("No files found in the archive.");
        process.exit(0);
    }

    const { selectedFile } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedFile',
        message: 'Select a file to display or process:',
        choices
    }]);

    return selectedFile;
};

// Process the selected file
const processSelectedFile = async (selectedFile, fileType, url) => {
    try {
        if (fileType === 'zip') {
            await openZipFile(selectedFile, url);
        } else if (fileType === 'tar') {
            const isGzipped = path.extname(url).toLowerCase() === '.gz';
            await handleTarFile(selectedFile, isGzipped, url);
        }
    } catch (error) {
        console.error('Error processing file content:', error);
    }
};

// Main script entry point
const main = async () => {
    try {
        const [url] = process.argv.slice(2);
        if (!url || !validUrl.isWebUri(url)) {
            console.error('Usage: <url>');
            process.exit(1);
        }

        const fileType = getFileType(url);
        let files;

        if (fileType === 'zip') {
            const headResponse = await fetch(url, { method: 'HEAD' });
            const contentLength = headResponse.headers.get('content-length');
            files = await listZipFiles(contentLength, url);
        } else if (fileType === 'tar') {
            const isGzipped = path.extname(url).toLowerCase() === '.gz';
            files = await listTarFiles(url, isGzipped); // List files with partial fetch
        }

        const selectedFile = await listAndSelectFile(files);
        await processSelectedFile(selectedFile, fileType, url);

    } catch (error) {
        console.error('An error occurred during processing:', error);
        process.exit(1);
    }
};

main();
