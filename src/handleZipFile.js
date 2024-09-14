const zlib = require('zlib');
const stream = require('stream');
const path = require('path');
const { getRange } = require('./fileHandler');
const getFileHandler = require('./getFileHandler');

// Create information about the ZIP file entries
const createZipFileInfo = (filename, date_time, headerOffset, compressType, compressSize, fileSize) => {
    const getBits = (val, ...args) => args.map(n => {
        const bit = val & (2 ** n - 1);
        val >>= n;
        return bit;
    });

    const [sec, mins, hour, day, mon, year] = getBits(date_time, 5, 6, 5, 5, 4, 7);
    const date_timeArray = [year + 1980, mon, day, hour, mins, sec];

    return {
        filename,
        headerOffset,
        compressType,
        compressSize,
        fileSize,
        date_time: date_timeArray,
        isDir: () => filename.endsWith('/'),
    };
};

// Function to get the Central Directory of a ZIP file
const getCentralDirectory = async (zipSize, url) => {
    try {
        const eocdData = await getRange(url, Math.max(zipSize - 65536, 0), 65536);
        const eocdOffset = eocdData.lastIndexOf(Buffer.from('504b0506', 'hex'));

        if (eocdOffset === -1) throw new Error('Cannot find the End of Central Directory (EOCD) in the ZIP file.');

        const cdirOffset = eocdData.readUInt32LE(eocdOffset + 16);
        const cdirSize = eocdData.readUInt32LE(eocdOffset + 12);

        return getRange(url, cdirOffset, cdirSize);
    } catch (error) {
        console.error('Error fetching Central Directory:', error);
        throw error;
    }
};

const listZipFiles = async (zipSize, url) => {
    try {
        console.log(`ZIP Size: ${zipSize}, URL: ${url}`);
        const cdirData = await getCentralDirectory(zipSize, url);
        const files = [];

        let offset = 0;
        while (offset < cdirData.length) {
            const fileNameLength = cdirData.readUInt16LE(offset + 28);
            const extraFieldLength = cdirData.readUInt16LE(offset + 30);
            const fileName = cdirData.slice(offset + 46, offset + 46 + fileNameLength).toString('utf-8');

            // Compressed and uncompressed sizes
            const compressSize = cdirData.readUInt32LE(offset + 20);  // Compressed size
            const uncompressSize = cdirData.readUInt32LE(offset + 24); // Uncompressed size

            const fileInfo = createZipFileInfo(
                fileName,
                cdirData.readUInt32LE(offset + 12),
                cdirData.readUInt32LE(offset + 42),
                cdirData.readUInt16LE(offset + 10),
                compressSize,
                uncompressSize
            );

            files.push(fileInfo);
            offset += 46 + fileNameLength + extraFieldLength + cdirData.readUInt16LE(offset + 32);
        }

        return files;
    } catch (error) {
        console.error('Error listing files from ZIP:', error);
        throw error;
    }
};


// Open a ZIP file, process it with the correct handler based on the extension
const openZipFile = async (file, url) => {
    try {
        const localHeaderData = await getRange(url, file.headerOffset, 30);
        const fileNameLength = localHeaderData.readUInt16LE(26);
        const extraFieldLength = localHeaderData.readUInt16LE(28);
        const fileDataOffset = file.headerOffset + 30 + fileNameLength + extraFieldLength;
        const fileData = await getRange(url, fileDataOffset, file.compressSize);

        if (file.compressSize > 0 && fileData.length !== file.compressSize) {
            throw new Error('File data size mismatch.');
        }

        let fileStream;
        if (file.compressType === 0) {
            fileStream = stream.Readable.from(fileData); // No compression
        } else if (file.compressType === 8) {
            fileStream = stream.Readable.from(fileData).pipe(zlib.createInflateRaw()); // Deflate compression
        } else {
            throw new Error(`Unsupported compression method: ${file.compressType}`);
        }

        // Dynamically load the appropriate handler based on file extension
        const extension = path.extname(file.filename).substring(1);
        const handler = await getFileHandler(extension);

        if (handler) {
            await handler(fileStream);
        } else {
            console.error(`No handler found for file: ${file.filename}`);
        }
    } catch (error) {
        console.error(`Error opening ZIP file entry: ${file.filename}`, error);
        throw error;
    }
};

module.exports = { listZipFiles, openZipFile, getCentralDirectory };
