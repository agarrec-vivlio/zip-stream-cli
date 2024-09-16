const readline = require("readline");
const chalk = require("chalk");

// Function to handle code files and syntax-highlight them in the terminal
module.exports = async function handleCodeFile(fileStream) {
  const rl = readline.createInterface({
    input: fileStream,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", (line) => {
    console.log(chalk.green(line)); // Syntax highlight lines (simple green)
  });
};
