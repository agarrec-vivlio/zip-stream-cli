const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream/promises');

// Function to dynamically import terminal-image
async function getTerminalImage() {
    const terminalImage = await import('terminal-image');
    return terminalImage.default;
}

// Function to handle image files and display them in the terminal
module.exports = async function handleImageFile(fileStream) {
    const imagePath = path.join(__dirname, 'temp_image.jpg');
    const writeStream = fs.createWriteStream(imagePath);

    try {
        await pipeline(fileStream, writeStream);
        const terminalImage = await getTerminalImage();
        const image = await terminalImage.file(imagePath, { width: '50%', height: '50%' });
        console.log(image);
    } catch (error) {
        console.error('Error processing image file:', error.message);
    } finally {
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }
}