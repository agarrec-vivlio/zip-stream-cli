const { processAudioStreamProgressively } = require('../utils/audioUtils.js');

// Function to handle audio files and display waveform
module.exports = async function handleAudioFile(fileStream) {
    // Process and display the audio waveform
    await processAudioStreamProgressively(fileStream);
}