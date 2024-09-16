const unzipper = require("unzipper");

module.exports = async function handleArchiveFile(fileStream) {
  fileStream.pipe(unzipper.Parse()).on("entry", (entry) => {
    console.log(`File: ${entry.path}, Type: ${entry.type}`);
    entry.autodrain();
  });
};
