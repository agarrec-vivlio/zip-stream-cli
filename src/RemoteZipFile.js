const fetch = require('node-fetch');
const zlib = require('zlib');
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);

const createRemoteZipInfo = (filename, date_time, headerOffset, compressType, compressSize, fileSize) => {
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
    parseExtra: extra => {
      let i = 0;
      while (i < extra.length) {
        const fieldId = extra.readUInt16LE(i);
        const fieldSize = extra.readUInt16LE(i + 2);
        i += 4;
        if (fieldId === 0x0001) {
          if (fileSize === 0xffffffff) fileSize = extra.readBigUInt64LE(i);
          if (compressSize === 0xffffffff) compressSize = extra.readBigUInt64LE(i + 8);
          if (headerOffset === 0xffffffff) headerOffset = extra.readBigUInt64LE(i + 16);
        }
        i += fieldSize;
      }
    }
  };
};

const createRemoteZipFile = (url) => {
  const fetchHead = async () => {
    const response = await fetch(url, { method: 'HEAD' });
    const acceptRanges = response.headers.get('Accept-Ranges');
    if (!acceptRanges || acceptRanges !== 'bytes') {
      console.warn(`${new URL(url).hostname} does not support byte ranges. Proceeding anyway...`);
    }
    const zipSize = parseInt(response.headers.get('Content-Length'), 10);
    return zipSize;
  };

  const getRange = async (start, length) => {
    const response = await fetch(url, {
      headers: { 'Range': `bytes=${start}-${start + length - 1}` }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch range ${start}-${start + length - 1}: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  };

  const getCentralDirectory = async (zipSize) => {
    const eocdData = await getRange(Math.max(zipSize - 65536, 0), 65536);
    const eocdOffset = eocdData.lastIndexOf(Buffer.from('504b0506', 'hex'));

    if (eocdOffset === -1) throw new Error('Cannot find central directory');

    const cdirOffset = eocdData.readUInt32LE(eocdOffset + 16);
    const cdirSize = eocdData.readUInt32LE(eocdOffset + 12);

    return getRange(cdirOffset, cdirSize);
  };

  const listFiles = async (zipSize) => {
    const cdirData = await getCentralDirectory(zipSize);
    const files = [];

    let offset = 0;
    while (offset < cdirData.length) {
      const fileNameLength = cdirData.readUInt16LE(offset + 28);
      const extraFieldLength = cdirData.readUInt16LE(offset + 30);
      const fileName = cdirData.slice(offset + 46, offset + 46 + fileNameLength).toString('utf-8');

      const fileInfo = createRemoteZipInfo(
        fileName,
        cdirData.readUInt32LE(offset + 12),
        cdirData.readUInt32LE(offset + 42),
        cdirData.readUInt16LE(offset + 10),
        cdirData.readUInt32LE(offset + 20),
        cdirData.readUInt32LE(offset + 24)
      );

      fileInfo.parseExtra(cdirData.slice(offset + 46 + fileNameLength, offset + 46 + fileNameLength + extraFieldLength));
      files.push(fileInfo);
      offset += 46 + fileNameLength + extraFieldLength + cdirData.readUInt16LE(offset + 32);
    }

    return files;
  };

  const openFile = async (file, zipSize) => {
    const localHeaderData = await getRange(file.headerOffset, 30);
    const fileNameLength = localHeaderData.readUInt16LE(26);
    const extraFieldLength = localHeaderData.readUInt16LE(28);

    const fileData = await getRange(
      file.headerOffset + 30 + fileNameLength + extraFieldLength,
      file.compressSize
    );

    if (file.compressType === 0) {
      return stream.Readable.from(fileData);
    } else if (file.compressType === 8) {
      return stream.Readable.from(fileData).pipe(zlib.createInflateRaw());
    } else {
      throw new Error(`Unsupported compression method: ${file.compressType}`);
    }
  };

  const extractFile = async (file, outputPath) => {
    const fileStream = await openFile(file);
    const fullPath = path.join(outputPath, file.filename);

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    await pipeline(fileStream, fs.createWriteStream(fullPath));
    console.log(`Extracted: ${fullPath}`);
  };

  const extractAll = async (outputPath, zipSize) => {
    const files = await listFiles(zipSize);
    for (const file of files) {
      if (!file.isDir()) {
        await extractFile(file, outputPath);
      }
    }
  };

  return {
    fetchHead,
    listFiles,
    openFile,
    extractAll
  };
};

module.exports = { createRemoteZipFile, createRemoteZipInfo };
