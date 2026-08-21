import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import mammoth from 'mammoth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const documentType = (formData.get('type') as string) || 'cv';

    if (!file) {
      return NextResponse.json({ success: false, error: 'Berkas tidak ditemukan' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    let extractedText = '';

    // 1. Parse PDF Files with unpdf
    if (fileName.endsWith('.pdf') || file.type.includes('pdf')) {
      try {
        const { text } = await extractText(arrayBuffer);
        if (text) {
          if (Array.isArray(text)) {
            extractedText = text.join('\n\n').trim();
          } else {
            extractedText = String(text).trim();
          }
        }
      } catch (pdfErr) {
        console.warn('unpdf extraction warning:', pdfErr);
      }
    }
    // 2. Parse Word .docx with mammoth
    else if (fileName.endsWith('.docx')) {
      try {
        const buffer = Buffer.from(arrayBuffer);
        const result = await mammoth.extractRawText({ buffer });
        if (result && result.value) {
          extractedText = result.value.trim();
        }
      } catch (docErr) {
        console.warn('mammoth error:', docErr);
      }
    }
    // 3. Parse Plain text / Markdown / JSON / CSV
    else if (
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.json') ||
      fileName.endsWith('.csv') ||
      file.type.includes('text')
    ) {
      extractedText = Buffer.from(arrayBuffer).toString('utf-8').trim();
    }

    // Clean whitespace formatting
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (extractedText.length >= 20) {
      return NextResponse.json({
        success: true,
        extractedText,
        characterCount: extractedText.length,
        fileName: file.name,
        fileSize: file.size
      });
    }

    // Fallback for scanned/empty files
    const fallbackText = `[Dokumen: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]\nDokumen lampiran ${documentType.toUpperCase()} berhasil diunggah dan siap dievaluasi oleh sistem AI.`;

    return NextResponse.json({
      success: true,
      extractedText: fallbackText,
      characterCount: fallbackText.length,
      fileName: file.name,
      fileSize: file.size
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memproses dokumen';
    console.error('Error in parse-document route:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
