import pdf from 'pdf-parse/lib/pdf-parse';
import fs from 'fs-extra';
import path from 'path';

export async function handler() {
  try {
    const folderPath = path.join(__dirname, 'docs');
    const cachePath = path.join(process.cwd(), '.netlify', 'functions-serve', '.cache');

    await fs.ensureDir(cachePath);

    const files = await fs.readdir(folderPath);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No PDF files found in docs folder.' }),
      };
    }

    const texts = await Promise.all(
      pdfFiles.map(async file => {
        const dataBuffer = await fs.readFile(path.join(folderPath, file));
        const data = await pdf(dataBuffer);
        return data.text;
      })
    );

    const combinedText = texts.join('\n\n---\n\n');

    await fs.writeFile(path.join(cachePath, 'cache.txt'), combinedText, 'utf-8');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Cache generated successfully.' }),
    };
  } catch (error) {
    console.error('Error generating cache:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
