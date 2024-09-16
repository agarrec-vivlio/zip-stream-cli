const load = require('audio-loader');
const Speaker = require('speaker');
const readline = require('readline');
const cliProgress = require('cli-progress');

/**
 * Processes and plays an audio stream with real-time playback progress shown in the CLI.
 * The function buffers the audio stream, plays it through the speaker, and displays
 * a progress bar in the terminal to track playback. The process can be stopped with `Ctrl+C`.
 * 
 * @param {stream.Readable} audioStream - The audio stream to process and play.
 * 
 * @returns {Promise<void>} A promise that resolves when the audio playback is completed.
 */
async function handleAudioStreamWithPlayPause(audioStream) {
    const chunks = [];

    for await (const chunk of audioStream) {
        chunks.push(chunk);
    }

    const audioBuffer = Buffer.concat(chunks);
    const audioData = await load(audioBuffer);

    const speaker = new Speaker({
        channels: audioData.numberOfChannels,
        bitDepth: 16,
        sampleRate: audioData.sampleRate
    });

    let currentSampleIndex = 0;
    const totalSamples = audioData.length * audioData.numberOfChannels;

    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(totalSamples, 0);

    const writeAudioToSpeaker = () => {
        const sampleData = audioData.getChannelData(0);

        const writeData = () => {
            if (currentSampleIndex < sampleData.length) {
                const chunk = Buffer.alloc(2);
                const sample = Math.max(-1, Math.min(1, sampleData[currentSampleIndex++]));
                chunk.writeInt16LE(sample * 32767, 0);

                if (!speaker.write(chunk)) {
                    speaker.once('drain', writeData);
                } else {
                    setImmediate(writeData);
                }

                progressBar.update(currentSampleIndex);
            } else {
                speaker.end();
                progressBar.stop();
                process.stdin.setRawMode(false);
                process.stdin.pause();
            }
        };

        writeData();
    };

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on('keypress', (key) => {
        if (key.ctrl && key.name === 'c') {
            progressBar.stop();
            speaker.end();
            process.stdin.setRawMode(false);
            process.exit();
        }
    });

    writeAudioToSpeaker();
}

module.exports = handleAudioStreamWithPlayPause;