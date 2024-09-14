const pdf = require('pdf-parse');

module.exports = async function handlePdfFile(fileStream) {
    const chunks = [];
    
    for await (const chunk of fileStream) {
        chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    try {
        const data = await pdf(buffer);
        console.log(data.text);  // Display extracted text from PDF
    } catch (err) {
        console.error('Error parsing PDF:', err.message);
    }
}