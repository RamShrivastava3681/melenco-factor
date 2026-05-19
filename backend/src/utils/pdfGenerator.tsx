import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import FrameworkAgreementDocument from '../documents/frameworkAgreement';

/**
 * Generates a Framework Agreement PDF using the React PDF template.
 * @param data The agreement data to populate the template.
 * @returns A Buffer containing the generated PDF.
 */
export async function generateFrameworkAgreementPDF(data: any): Promise<Buffer> {
  try {
    // Render the React component to a PDF buffer
    const buffer = await renderToBuffer(
      <FrameworkAgreementDocument data={data} />
    );
    return buffer as Buffer;
  } catch (error) {
    console.error('Error generating React PDF:', error);
    throw error;
  }
}
