export const parseHymnInput = (text) => {
  if (!text) return [];
  
  return text
    .split(',')
    .map(item => item.trim())
    .filter(item => {
      const num = parseInt(item, 10);
      return !isNaN(num) && num > 0;
    })
    .map(item => parseInt(item, 10)) // convert to number for sorting
    .sort((a, b) => a - b)
    .filter((item, index, array) => array.indexOf(item) === index) // dedupe
    .map(num => String(num)); // format back to string without leading zeros
};

export const getHymnFileName = (number, type) => {
    // number is expected to be a string like "008" or "339"
    // However, the source file might be "8.pdf" or "339.pdf".
    // We will verify existence in the main logic, but here we just return the formatting rules requested.
    
    // Output format guidelines:
    // Main -> 339-S.pdf (Wait, user said "Main -> 339-S.pdf" in one place, but "Combined file" naming is different)
    // Actually, "Convert to PDF file names: Main -> 339-S.pdf" seems to imply INDIVIDUAL files?
    // No, that example was under "Convert to PDF file names".
    // AND "Combine local PDF files... File naming format examples: Selected date... -> 2026-01-25-S.pdf"
    
    // The "Main -> 339-S.pdf" likely refers to how it looks in the COMBINED pdf if we were creating a TOC, 
    // OR it was an example of how the constituent files might be named if we were generating them. 
    // BUT we are merging existing PDFs.
    
    // Let's assume the user meant:
    // Input "339" -> finds "339.pdf" (or "001.pdf")
    
    // Let's stick to returning the raw number or formatted number for lookup.
    return number; 
};

export const formatHymnForDisplay = (number) => {
    return String(number);
};
