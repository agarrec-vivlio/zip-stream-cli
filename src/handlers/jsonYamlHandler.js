const yaml = require("js-yaml");

module.exports = async function handleJsonYamlFile(fileStream, extension) {
  const chunks = [];
  for await (const chunk of fileStream) {
    chunks.push(chunk);
  }
  const data = Buffer.concat(chunks).toString();

  if (extension === "json") {
    console.log(JSON.stringify(JSON.parse(data), null, 2)); // Pretty-print JSON
  } else if (extension === "yaml" || extension === "yml") {
    const yamlData = yaml.load(data);
    console.log(yaml.dump(yamlData)); // Pretty-print YAML
  }
};
