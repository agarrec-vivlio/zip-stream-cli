const Chart = require('cli-chart');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

// Use dynamic import to load the audio-decode ES module
async function getAudioDecoder() {
    const { default: audioDecode } = await import('audio-decode');
    return audioDecode;
}

// Function to process and display audio progressively (streaming mode)
async function processAudioStreamProgressively(audioStream, maxWidth = 30) {
    const chart = new Chart({
        xlabel: '',
        ylabel: '',
        direction: Chart.Vertical,
        height: 5,  // Compact height
        width: maxWidth,  // Max width
        lmargin: 0,
        step: 2
    });

    const chunks = [];
    let processedSamples = 0;
    let totalSamples = 0;

    function redrawChart() {
        chart.draw(); // Redraw the chart
    }

    // Streaming mode: process and display waveform live
    for await (const chunk of audioStream) {
        chunks.push(chunk);

        const audioBuffer = Buffer.concat(chunks);
        const audioDecode = await getAudioDecoder();

        try {
            const decodedAudio = await audioDecode(audioBuffer, { sampleRate: 44100 });
            const sampleData = decodedAudio.getChannelData(0);

            totalSamples = sampleData.length;

            // Streamed waveform display logic
            for (let i = processedSamples; i < totalSamples; i += Math.ceil(totalSamples / maxWidth)) {
                const amplitude = Math.abs(sampleData[i]) * 5;  // Scale for visibility
                chart.addBar(amplitude);
            }

            redrawChart();
            processedSamples = totalSamples;
        } catch (err) {
            console.error('Error decoding audio:', err.message);
        }
    }
}

// Function to process audio in non-streaming mode (buffer the entire audio first)
async function processBufferedAudio(audioStream, maxWidth = 30) {
    const chunks = [];

    // Buffer the entire audio stream
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
            height: 5,  // Compact height
            width: maxWidth,  // Max width
            lmargin: 0,
            step: 2
        });

        const totalSamples = sampleData.length;

        for (let i = 0; i < totalSamples; i += Math.ceil(totalSamples / maxWidth)) {
            const amplitude = Math.abs(sampleData[i]) * 5;  // Scale for visibility
            chart.addBar(amplitude);
        }

        chart.draw();  // Draw the chart after processing all data
    } catch (err) {
        console.error('Error decoding audio:', err.message);
    }
}

module.exports = {
    processAudioStreamProgressively,
    processBufferedAudio
};
