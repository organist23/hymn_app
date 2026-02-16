import * as FileSystem from 'expo-file-system/legacy';
import { PDFDocument } from 'pdf-lib';

const HEADER_HEIGHT = 50; // Approximated for visual consistency if we were drawing texts, but we are just merging.

export const createCombinedPdf = async (hymnFiles, outputFilename) => {
  try {
    const pdfDoc = await PDFDocument.create();
    
    for (const fileUri of hymnFiles) {
        // fileUri should be a local URI like file:///...
        // We read as base64
        const fileContent = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        
        const srcDoc = await PDFDocument.load(fileContent);
        // Copy all pages
        const copiedPages = await pdfDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach((page) => pdfDoc.addPage(page));
    }

    const pdfBytes = await pdfDoc.saveAsBase64();
    
    // Check/Create directory
    const combinedDir = FileSystem.documentDirectory + 'combined/';
    const dirInfo = await FileSystem.getInfoAsync(combinedDir);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(combinedDir, { intermediates: true });
    }

    const uri = combinedDir + outputFilename;
    await FileSystem.writeAsStringAsync(uri, pdfBytes, {
        encoding: FileSystem.EncodingType.Base64,
    });

    return uri;
  } catch (error) {
    console.error("Error creating PDF:", error);
    throw error;
  }
};
