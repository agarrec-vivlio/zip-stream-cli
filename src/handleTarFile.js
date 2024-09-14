const zlib = require('zlib');
const tar = require('tar-stream'); // Tar stream for handling tar files
const stream = require('stream');
const path = require('path');
const getFileHandler = require('./getFileHandler');

let globalBuffer = null; // Global buffer to store the stream content

// Function to read the entire stream and store it in a global buffer
const bufferFileStream = async (fileStream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        fileStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        fileStream.on('end', () => {
            globalBuffer = Buffer.concat(chunks); // Store the entire file content in globalBuffer
            resolve(globalBuffer); // Resolve when the buffer is fully read
        });

        fileStream.on('error', (err) => {
            reject(err); // Handle errors
        });
    });
};

// Handle .tar and .tar.gz (gzip) files
const handleTarFile = async (selectedFile, isGzipped) => {
    return new Promise((resolve, reject) => {
        try {
            const extract = tar.extract();
            let fileFound = false; // To track if the file is found

            const fileStream = stream.Readable.from(globalBuffer); // Create a readable stream from global buffer

            extract.on('entry', (header, entryStream, next) => {
                if (fileFound) {
                    entryStream.resume(); // Skip further entries once the file is found
                    return next();
                }

                const isDirectory = header.type === 'directory';
                if (header.name !== selectedFile.filename || isDirectory) {
                    entryStream.resume();
                    return next(); // Skip non-matching files and directories
                }

                fileFound = true; // Mark the file as found
                const chunks = [];
                entryStream.on('data', (chunk) => chunks.push(chunk)); // Collect the data chunks

                entryStream.on('end', async () => {
                    try {
                        const fileContent = Buffer.concat(chunks); // Combine all data chunks
                        const handler = await getFileHandler(path.extname(header.name).substring(1)); // Get the file handler

                        const contentStream = stream.Readable.from(fileContent); // Convert buffer to readable stream
                        await handler(contentStream); // Process the stream with the handler
                        next(); // Move to the next entry after processing
                    } catch (error) {
                        console.error(`Error processing ${header.name}:`, error);
                        next(); // Proceed even if there's an error
                    }
                });

                entryStream.resume(); // Ensure the stream continues to flow
            });

            extract.on('error', (err) => {
                console.error('Error in TAR extraction:', err);
                reject(err); // Reject on error
            });

            extract.on('finish', () => {
                if (!fileFound) {
                    reject(new Error(`File ${selectedFile} not found in the archive.`));
                } else {
                    resolve(); // Resolve if the file was found and processed
                }
            });

            const streamHandler = isGzipped ? zlib.createGunzip() : extract;
            fileStream.pipe(isGzipped ? streamHandler.pipe(extract) : streamHandler); // Handle gzipped or plain tar files
        } catch (err) {
            console.error('Error handling tar file:', err);
            reject(err); // Reject if there's an error
        }
    });
};

// List files from a .tar or .tar.gz archive without buffering the entire stream
const listTarFiles = async (isGzipped) => {
    return new Promise((resolve, reject) => {
        const extract = tar.extract();
        const files = [];

        const fileStream = stream.Readable.from(globalBuffer); // Recreate a readable stream from the global buffer

        extract.on('entry', (header, entryStream, next) => {
            const isDirectory = header.type === 'directory'; // Detect if the entry is a directory
            const fileInfo = {
                filename: header.name,
                fileSize: header.size,
                isDir: isDirectory, // Define isDir based on header type
            };
            files.push(fileInfo); // Push file info to the list

            entryStream.on('end', next); // Signal that the stream has finished
            entryStream.resume(); // Ensure the stream is consumed
        });

        extract.on('finish', () => {
            resolve(files); // Resolve with the list of files
        });

        extract.on('error', (err) => {
            reject(err); // Handle errors
        });

        if (isGzipped) {
            fileStream.pipe(zlib.createGunzip()).pipe(extract); // Handle .tar.gz files
        } else {
            fileStream.pipe(extract); // Handle plain .tar files
        }
    });
};


module.exports = { handleTarFile, listTarFiles, bufferFileStream };
