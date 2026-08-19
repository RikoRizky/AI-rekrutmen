/**
 * Helper to extract readable text content from uploaded files (PDF, DOCX/DOC, TXT, MD)
 */

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // 1. Plain Text / Markdown / JSON / CSV
  if (
    fileType.includes('text') ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.json') ||
    fileName.endsWith('.csv')
  ) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(new Error('Gagal membaca file teks'));
      reader.readAsText(file);
    });
  }

  // 2. PDF Parsing via client-side binary text extraction or ArrayBuffer
  if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const text = extractTextFromPdfArrayBuffer(arrayBuffer);
      if (text && text.trim().length > 50) {
        return text;
      }
      // If direct binary extraction gave minimal text, return structured fallback with file metadata
      return `[Dokumen PDF: ${file.name} - Ukuran: ${(file.size / 1024).toFixed(1)} KB]\n${text || 'Isi dokumen PDF berhasil diunggah.'}`;
    } catch (e) {
      console.warn('PDF extraction fallback used', e);
      return `[Dokumen PDF: ${file.name}]`;
    }
  }

  // 3. Word (.docx / .doc) or other documents
  if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = decoder.decode(arrayBuffer);
      // Clean XML tags from docx zip stream if any
      const cleaned = rawText
        .replace(/<[^>]+>/g, ' ')
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleaned.length > 50) {
        return `[Dokumen Word: ${file.name}]\n${cleaned.slice(0, 3000)}`;
      }
      return `[Dokumen Word: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]`;
    } catch {
      return `[Dokumen: ${file.name}]`;
    }
  }

  // Generic fallback: read as text
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const clean = res.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      resolve(clean.slice(0, 2000) || `[File: ${file.name}]`);
    };
    reader.onerror = () => resolve(`[File: ${file.name}]`);
    reader.readAsText(file);
  });
}

/**
 * Basic PDF text stream decoder for client-side without heavy external worker dependencies
 */
function extractTextFromPdfArrayBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let text = '';
  const str = new TextDecoder('latin1').decode(bytes);

  // Match text objects in PDF streams: BT ... ET blocks and (string) Tj / [strings] TJ
  const streamRegex = /BT[\s\S]*?ET/g;
  const matches = str.match(streamRegex);

  if (matches && matches.length > 0) {
    for (const block of matches) {
      // Find (text) Tj
      const tjMatches = block.match(/\(([^)]+)\)\s*Tj/g);
      if (tjMatches) {
        for (const tj of tjMatches) {
          const matchContent = tj.match(/\(([^)]+)\)\s*Tj/);
          if (matchContent && matchContent[1]) {
            text += matchContent[1] + ' ';
          }
        }
      }

      // Find [(text1)(text2)] TJ
      const tjArrayMatches = block.match(/\[([^\]]+)\]\s*TJ/g);
      if (tjArrayMatches) {
        for (const tja of tjArrayMatches) {
          const innerStrings = tja.match(/\(([^)]+)\)/g);
          if (innerStrings) {
            for (const s of innerStrings) {
              text += s.replace(/[()]/g, '') + ' ';
            }
          }
        }
      }
      text += '\n';
    }
  }

  // If stream regex didn't find structured text, search for plain printable characters
  if (!text || text.trim().length < 30) {
    const plainRegex = /\/Contents\s+([0-9]+\s+[0-9]+\s+R|\<[0-9a-fA-F]+\>)/g;
    // Extract any parenthesized strings
    const parenStrings = str.match(/\(([a-zA-Z0-9\s.,@:;/\-_+&()]{3,100})\)/g);
    if (parenStrings) {
      text = parenStrings.map(s => s.slice(1, -1)).join(' ');
    }
  }

  return text.replace(/\\([()\\])/g, '$1').replace(/\s+/g, ' ').trim();
}
