#!/usr/bin/env node

const { listZipFiles, openZipFile } = require('../src/handleZipFile');
const { handleTarFile, listTarFiles, bufferFileStream } = require('../src/handleTarFile');
const inquirer = require('inquirer');
const path = require('path');
const validUrl = require('valid-url');
const fetch = require('node-fetch');
const stream = require('stream');

// Determine the file type based on the URL extension
const getFileType = (url) => {
    const ext = path.extname(url).toLowerCase();
    if (ext === '.zip') return 'zip';
    if (ext === '.tar' || ext === '.gz') return 'tar';
    throw new Error('Unsupported file type. Only .zip, .tar, and .tar.gz are supported.');
};

// Ensure the fileStream is a readable stream
const ensureReadableStream = (fileStream) => {
    if (fileStream instanceof stream.Readable) return fileStream;
    if (Buffer.isBuffer(fileStream)) return stream.Readable.from(fileStream);
    throw new Error("fileStream is neither a readable stream nor a Buffer.");
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
const processSelectedFile = async (fileStream, selectedFile, fileType, url) => {
    try {
        if (fileType === 'zip') {
            await openZipFile(selectedFile, url);
        } else if (fileType === 'tar') {
            const isGzipped = path.extname(url).toLowerCase() === '.gz';
            await handleTarFile(selectedFile, isGzipped);
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
        const response = await fetch(url);
        let fileStream = ensureReadableStream(response.body);

        let files;
        if (fileType === 'zip') {
            const contentLength = response.headers.get('content-length');
            files = await listZipFiles(contentLength, url);
        } else if (fileType === 'tar') {
            const isGzipped = path.extname(url).toLowerCase() === '.gz';
            await bufferFileStream(fileStream);
            files = await listTarFiles(isGzipped);
        }

        const selectedFile = await listAndSelectFile(files);
        await processSelectedFile(fileStream, selectedFile, fileType, url);

    } catch (error) {
        console.error('An error occurred during processing:', error);
        process.exit(1);
    }
};

main();
