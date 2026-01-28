import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function saveFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate unique filename to avoid collisions
  const uniqueSuffix = uuidv4();
  const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, ''); // Sanitize
  const filename = `${uniqueSuffix}-${originalName}`;
  
  // Save to public/uploads
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  const filepath = join(uploadDir, filename);
  
  await writeFile(filepath, buffer);
  
  // Return public URL
  return `/uploads/${filename}`;
}
