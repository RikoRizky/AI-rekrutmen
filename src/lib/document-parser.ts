/**
 * Helper to extract readable text content from uploaded files (PDF, DOCX/DOC, TXT, MD)
 */

export async function extractTextFromFile(file: File, documentType: string = 'cv'): Promise<string> {
  // 1. Try server-side parser via /api/parse-document with pdf-parse and mammoth
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', documentType);

    const res = await fetch('/api/parse-document', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.extractedText && data.extractedText.trim().length > 0) {
        return data.extractedText.trim();
      }
    }
  } catch (apiErr) {
    console.warn('Server document parser API fallback:', apiErr);
  }

  // 2. Client-side fallback: Plain Text / Markdown / JSON / CSV
  const fileName = file.name.toLowerCase();
  const fileType = file.type;

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

  // 3. Client-side fallback: PDF extraction
  if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const text = extractTextFromPdfArrayBuffer(arrayBuffer);
      if (text && text.trim().length > 30) {
        return text;
      }
      return `[Dokumen PDF: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]\nDokumen lampiran ${documentType.toUpperCase()} berhasil diunggah.`;
    } catch {
      return `[Dokumen PDF: ${file.name}]`;
    }
  }

  // 4. Generic fallback
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = (reader.result as string) || '';
      const clean = res.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      resolve(clean.slice(0, 3000) || `[Berkas: ${file.name}]`);
    };
    reader.onerror = () => resolve(`[Berkas: ${file.name}]`);
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

  const streamRegex = /BT[\s\S]*?ET/g;
  const matches = str.match(streamRegex);

  if (matches && matches.length > 0) {
    for (const block of matches) {
      const tjMatches = block.match(/\(([^)]+)\)\s*Tj/g);
      if (tjMatches) {
        for (const tj of tjMatches) {
          const matchContent = tj.match(/\(([^)]+)\)\s*Tj/);
          if (matchContent && matchContent[1]) {
            text += matchContent[1] + ' ';
          }
        }
      }

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

  if (!text || text.trim().length < 30) {
    const parenStrings = str.match(/\(([a-zA-Z0-9\s.,@:;/\-_+&()]{3,100})\)/g);
    if (parenStrings) {
      text = parenStrings.map((s) => s.slice(1, -1)).join(' ');
    }
  }

  return text.replace(/\\([()\\])/g, '$1').replace(/\s+/g, ' ').trim();
}
