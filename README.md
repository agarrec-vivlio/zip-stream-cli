
# Remote Zip File Extractor

This is a Node.js package to download and extract individual files from remote zip archives over HTTP, without downloading the entire archive. You can also interactively select files and display their content in the console.

## Installation

To install dependencies:

```bash
npm install
```

## Global Usage with `npm link`

You can make the `remote-zip-extractor` command available globally in your terminal using the `npm link` command. This allows you to use it without specifying the full path to the executable.

### Steps to link:

1. Run the following command inside the project directory to create a global link:

   ```bash
   npm link
   ```

2. You can now run the `remote-zip-extractor` command from anywhere in your terminal.

### Example:

To extract files from a remote ZIP file:

```bash
remote-zip-extractor https://example.com/myzip.zip ./output
```

Or, to list and display the content of a specific file interactively:

```bash
remote-zip-extractor https://example.com/myzip.zip
```
<img width="696" alt="Screenshot 2024-09-14 at 12 32 38" src="https://github.com/user-attachments/assets/88f0172d-64d0-41b7-a5c1-5559e361ecad">

<img width="699" alt="Screenshot 2024-09-14 at 12 45 47" src="https://github.com/user-attachments/assets/263795eb-b694-42d5-a617-77715b850e33">


## Usage

### Extract all files

You can run the script with:

```bash
remote-zip-extractor <url_to_zip> <output_directory>
```

For example:

```bash
remote-zip-extractor https://example.com/myzip.zip ./output
```

### List and display a specific file

If no output directory is specified, you'll be prompted to select a file and display its content in the console:

```bash
remote-zip-extractor https://example.com/myzip.zip
```

## Credits

This package was inspired by the Python package [unzip-http](https://github.com/saulpw/unzip-http) by Saul Pwanson, which allows extraction of individual files from zip archives over HTTP without downloading the entire archive.

## License

This project is licensed under the MIT License.
