const xlsx = require('xlsx');

// Function to handle and display spreadsheet files (xls, xlsx, csv)
module.exports = async function handleSpreadsheetFile(fileStream) {
    const chunks = [];

    for await (const chunk of fileStream) {
        chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    try {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_csv(sheet);
        console.log(data);  // Display CSV representation of the sheet
    } catch (err) {
        console.error('Error processing spreadsheet:', err.message);
    }
}