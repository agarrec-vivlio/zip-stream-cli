const readline = require('readline');

// Function to handle and display text files
module.exports = async function handleTextFile(fileStream) {
    const rl = readline.createInterface({
        input: fileStream,
        output: process.stdout,
        terminal: false
    });

    rl.on('line', (line) => {
        console.log(line);  // Print each line of the file
    });
}