import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import FrameworkAgreementDocument from './whizunik-framework';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.resolve(__dirname, 'WHIZUNIK_Framework_Agreement.pdf');

async function renderPdf() {
  await renderToFile(<FrameworkAgreementDocument />, outputPath);
  console.log(`PDF generated at ${outputPath}`);
}

renderPdf().catch((error) => {
  console.error('Failed to generate PDF:', error);
  process.exit(1);
});
