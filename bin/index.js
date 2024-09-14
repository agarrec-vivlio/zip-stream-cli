#!/usr/bin/env node

const { createRemoteZipFile } = require('../src/RemoteZipFile');
const inquirer = require('inquirer');
const path = require('path');
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);

async function listAndSelectFile(zipFile, zipSize) {
    try {
        const files = await zipFile.listFiles(zipSize);

        const choices = files
            .filter(file => !file.isDir()) // On exclut les répertoires
            .map(file => ({
                name: `${file.filename} (${file.fileSize} bytes)`,
                value: file
            }));

        const { selectedFile } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedFile',
                message: 'Select a file to display its content:',
                choices
            }
        ]);

        return selectedFile;
    } catch (error) {
        console.error('Error listing or selecting files:', error);
        process.exit(1);
    }
}

async function displayFileContent(zipFile, selectedFile) {
    try {
        const fileStream = await zipFile.openFile(selectedFile);
        console.log(`\nContent of ${selectedFile.filename}:\n`);
        await pipeline(fileStream, process.stdout); // Affiche le contenu du fichier dans la console
    } catch (error) {
        console.error('Error displaying file content:', error);
    }
}

async function main() {
    const [url, outputPath] = process.argv.slice(2);

    if (!url) {
        console.error('Usage: <url> [<output_path>]');
        process.exit(1);
    }

    const zipFile = createRemoteZipFile(url);
    const zipSize = await zipFile.fetchHead();

    // Si un chemin de sortie est fourni, on extrait tous les fichiers dans le répertoire spécifié
    if (outputPath) {
        console.log('Extracting all files...');
        await zipFile.extractAll(outputPath, zipSize);
    } else {
        // Sinon, on permet à l'utilisateur de lister et de sélectionner un fichier
        const selectedFile = await listAndSelectFile(zipFile, zipSize);
        await displayFileContent(zipFile, selectedFile);
    }
}

main();
