
# Zip stream CLI

**Zip stream CLI** is a Node.js library that allows you to extract and display content from various file types inside a zip archive directly in the terminal. The library supports multiple file types such as images, audio files, PDFs, text, spreadsheets, and more, with the option to extend functionality by adding new handlers.

## Features

- **Supports Multiple File Types**: Automatically detect and display content from various file types.
  
- **Modular Handler System**: 
  - Easily extend support for new file types by adding custom handlers.
  - Handlers for existing file types are dynamically loaded based on the file extension.
  
- **Stream and Display Audio Waveforms**: Display waveforms for audio files directly in the terminal.
  
- **Display Images**: View images as pixel art directly in the terminal.
  
- **Customizable Output**: Each file type is displayed using appropriate handlers, allowing you to customize the way content is shown for different types of files.

## Installation

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/agarrec-vivlio/zip-stream-cli
   cd zip-stream-cli
   ```

2. Install the required dependencies:

   ```bash
   npm install
   ```

## Global Usage with `npm link`

To make the `zip-stream-cli` command available globally in your terminal, you can use the `npm link` command. This will allow you to use the command without specifying the full path to the executable.

### Steps to use `npm link`:

1. Inside the project directory, run the following command to create a global link:

   ```bash
   npm link
   ```

2. You can now run the `zip-stream-cli` command from anywhere in your terminal.

### Example:

```bash
zip-stream-cli https://example.com/myzip.zip
```

## File Type Handlers

The library dynamically loads file handlers based on the file extension. Handlers for various file types are stored in the `handlers` directory.

The `typeMappings.json` file maps file extensions to their respective handlers. If a file type is not recognized or doesn't have a dedicated handler, it falls back to the `textHandler` to display the file as plain text.

### Supported File Types

| File Type        | Extensions                               | Handler           |
|------------------|------------------------------------------|-------------------|
| Text Files       | `.txt`, `.md`, `.html`                   | `textHandler`     |
| Audio Files      | `.mp3`, `.wav`, `.ogg`                   | `audioHandler`    |
| Image Files      | `.png`, `.jpg`, `.gif`, `.bmp`           | `imageHandler`    |
| PDF Files        | `.pdf`                                   | `pdfHandler`      |
| Spreadsheet Files| `.xls`, `.xlsx`, `.csv`                  | `spreadsheetHandler` |
| Code Files       | `.js`, `.py`, `.java`, `.rb`, etc.       | `codeHandler`     |
| Archive Files    | `.zip`, `.tar`, `.gz`                    | `archiveHandler`  |
| YAML & JSON Files| `.yaml`, `.yml`, `.json`                 | `jsonYamlHandler` |

### Adding a New File Type

The system is designed to be extensible, making it easy to add new handlers for different file types. Follow the steps below to add support for a new file type.

### Step 1: Create a New Handler

To add support for a new file type, create a new handler file inside the `handlers` directory.

Example: Create `customFileHandler.js` to handle a new file type, say `.custom`.

```javascript
// handlers/customFileHandler.js
module.exports = async function handleCustomFile(fileStream) {
    const chunks = [];

    for await (const chunk of fileStream) {
        chunks.push(chunk);
    }

    const fileContent = Buffer.concat(chunks).toString('utf-8');
    console.log('Displaying custom file content:');
    console.log(fileContent);  // Replace this with your custom logic to handle the file
}
```

### Step 2: Update `typeMappings.json`

Add the new file extension and map it to the newly created handler in `typeMappings.json`.

```json
{
    "custom": "customFileHandler",
    "txt": "textHandler",
    "md": "textHandler",
    "json": "jsonYamlHandler",
    "yaml": "jsonYamlHandler",
    "mp3": "audioHandler",
    "wav": "audioHandler",
    "png": "imageHandler",
    "jpg": "imageHandler"
}
```

### Step 3: Use Your Custom Handler

Now, when a file with the `.custom` extension is encountered, the library will use your `customFileHandler.js` to process and display the file.

## Screenshots

- **File Listing**:
  
  <img width="659" alt="Screenshot 2024-09-14 at 17 48 14" src="https://github.com/user-attachments/assets/fabb378a-a15b-4f2a-83b5-47c4e40ea8f8">


- **Image file output**:

  <img width="679" alt="Screenshot 2024-09-14 at 17 48 48" src="https://github.com/user-attachments/assets/dba1143b-ce81-4ed6-ab84-b097034206c5">


- **Text file output**:
  
  <img width="644" alt="Screenshot 2024-09-14 at 17 48 25" src="https://github.com/user-attachments/assets/fec12566-1e6f-4a85-97ab-0b9037641fef">


## Contributing

Contributions are welcome! Feel free to fork the repository, create new handlers, fix bugs, or add new features.

To contribute:
1. Fork this repository.
2. Create a new branch (`git checkout -b feature-new-handler`).
3. Add your feature or fix.
4. Push your branch and submit a pull request.

## License

This project is licensed under the MIT License.
