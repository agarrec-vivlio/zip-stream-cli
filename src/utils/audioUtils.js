const Chart = require('cli-chart');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

/**
 * Dynamically imports and returns the audio decoder.
 * @returns {Promise<Function>} - A promise that resolves to the audio decoder function.
 */
async function getAudioDecoder() {
    const { default: audioDecode } = await import('audio-decode');
    return audioDecode;
}

/**
 * Processes and displays audio data progressively in streaming mode.
 * @param {stream.Readable} audioStream - The audio stream to process.
 * @param {number} [maxWidth=30] - The maximum width of the chart display.
 * @returns {Promise<void>} - A promise that resolves when the audio stream has been processed.
 */
async function processAudioStreamProgressively(audioStream, maxWidth = 30) {
    const chart = new Chart({
        xlabel: '',
        ylabel: '',
        direction: Chart.Vertical,
        height: 5,
        width: maxWidth,
        lmargin: 0,
        step: 2
    });

    const chunks = [];
    let processedSamples = 0;
    let totalSamples = 0;

    function redrawChart() {
        chart.draw();
    }

    for await (const chunk of audioStream) {
        chunks.push(chunk);
        const audioBuffer = Buffer.concat(chunks);
        const audioDecode = await getAudioDecoder();

        try {
            const decodedAudio = await audioDecode(audioBuffer, { sampleRate: 44100 });
            const sampleData = decodedAudio.getChannelData(0);

            totalSamples = sampleData.length;

            for (let i = processedSamples; i < totalSamples; i += Math.ceil(totalSamples / maxWidth)) {
                const amplitude = Math.abs(sampleData[i]) * 5;
                chart.addBar(amplitude);
            }

            redrawChart();
            processedSamples = totalSamples;
        } catch (err) {
            console.error('Error decoding audio:', err.message);
        }
    }
}

/**
 * Processes audio data in non-streaming mode by buffering the entire audio first.
 * @param {stream.Readable} audioStream - The audio stream to buffer and process.
 * @param {number} [maxWidth=30] - The maximum width of the chart display.
 * @returns {Promise<void>} - A promise that resolves when the buffered audio has been processed.
 */
async function processBufferedAudio(audioStream, maxWidth = 30) {
    const chunks = [];

    for await (const chunk of audioStream) {
        chunks.push(chunk);
    }

    const audioBuffer = Buffer.concat(chunks);
    const audioDecode = await getAudioDecoder();

    try {
        const decodedAudio = await audioDecode(audioBuffer, { sampleRate: 44100 });
        const sampleData = decodedAudio.getChannelData(0);

        const chart = new Chart({
            xlabel: '',
            ylabel: '',
            direction: Chart.Vertical,
            height: 5,
            width: maxWidth,
            lmargin: 0,
            step: 2
        });

        const totalSamples = sampleData.length;

        for (let i = 0; i < totalSamples; i += Math.ceil(totalSamples / maxWidth)) {
            const amplitude = Math.abs(sampleData[i]) * 5;
            chart.addBar(amplitude);
        }

        chart.draw();
    } catch (err) {
        console.error('Error decoding audio:', err.message);
    }
}

module.exports = {
    processAudioStreamProgressively,
    processBufferedAudio
};
