import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate Request
    const sessionCookie = request.cookies.get('admin_session');
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    
    const expectedToken = crypto
      .createHmac('sha256', adminPass)
      .update(adminUser)
      .digest('hex');

    if (!sessionCookie || sessionCookie.value !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    // 2. Parse Multipart Form Data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    for (const file of files) {
      // 3. File Validations
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json({ 
          error: `Invalid file type: ${file.name}. Only JPEG, PNG, WEBP, and GIF are allowed.` 
        }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: `File too large: ${file.name}. Max size limit is 5MB.` 
        }, { status: 400 });
      }

      // 4. Safe Filename Generation
      const ext = path.extname(file.name) || '.jpg';
      const safeFilename = `${crypto.randomUUID()}${ext}`;
      const filepath = path.join(uploadDir, safeFilename);

      // Write File to Disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      uploadedUrls.push(`/uploads/${safeFilename}`);
    }

    return NextResponse.json({ success: true, urls: uploadedUrls });

  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to process file upload' }, { status: 500 });
  }
}
