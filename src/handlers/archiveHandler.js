const unzipper = require('unzipper');  // For zip, you can extend for tar

module.exports = async function handleArchiveFile(fileStream) {
    fileStream.pipe(unzipper.Parse())
        .on('entry', (entry) => {
            console.log(`File: ${entry.path}, Type: ${entry.type}`);
            entry.autodrain();  // Auto-handle the stream after listing
        });
}