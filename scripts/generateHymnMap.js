const fs = require('fs');
const path = require('path');

const pdfDir = path.join(__dirname, '..', 'pdf');
const outputFile = path.join(__dirname, '..', 'utils', 'hymnFileMap.js');

try {
  const files = fs.readdirSync(pdfDir).filter(file => file.endsWith('.pdf'));
  
  const imports = files.map(file => {
      // Create a key-value pair: "filename.pdf": require("../pdf/filename.pdf")
      // We need to escape backslashes? require uses forward slashes.
      return `'${file}': require('../pdf/${file}')`;
  });

  const content = `// Auto-generated file mapping for bundled PDFs
export const hymnAssets = {
  ${imports.join(',\n  ')}
};
`;

  fs.writeFileSync(outputFile, content);
  console.log(`Generated map for ${files.length} PDFs.`);
} catch (error) {
  console.error("Error generating map:", error);
}
