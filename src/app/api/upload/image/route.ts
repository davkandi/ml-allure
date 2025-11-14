import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { requireRoles, createAuthErrorResponse } from '@/lib/auth';

// Whitelist of allowed image extensions
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// Magic number signatures for image validation
const IMAGE_SIGNATURES: Record<string, number[][]> = {
  'jpg': [[0xFF, 0xD8, 0xFF]],
  'jpeg': [[0xFF, 0xD8, 0xFF]],
  'png': [[0x89, 0x50, 0x4E, 0x47]],
  'gif': [[0x47, 0x49, 0x46, 0x38]],
  'webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
};

/**
 * Verify file content matches expected image format using magic numbers
 */
function verifyImageMagicNumber(buffer: Buffer, extension: string): boolean {
  const signatures = IMAGE_SIGNATURES[extension.toLowerCase()];
  if (!signatures) return false;

  for (const signature of signatures) {
    let matches = true;
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }
  return false;
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
function sanitizeFilename(filename: string): string {
  // Remove path components
  return filename.replace(/^.*[\\\/]/, '')
    // Remove non-alphanumeric except dots and hyphens
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    // Remove multiple dots (prevent extension spoofing)
    .replace(/\.{2,}/g, '.')
    // Remove leading dots
    .replace(/^\.+/, '');
}

export async function POST(request: NextRequest) {
  // SECURITY FIX: Only ADMIN can upload images
  const authCheck = requireRoles(request, ['ADMIN']);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.error || 'Only administrators can upload images',
      403
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max) - check early to prevent processing large malicious files
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "File size must be less than 5MB",
          code: "FILE_TOO_LARGE"
        },
        { status: 400 }
      );
    }

    // SECURITY FIX: Sanitize and validate file extension
    const sanitizedFilename = sanitizeFilename(file.name);
    const extension = sanitizedFilename.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
          code: "INVALID_EXTENSION"
        },
        { status: 400 }
      );
    }

    // Convert file to buffer for validation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // SECURITY FIX: Verify actual file content using magic numbers
    if (!verifyImageMagicNumber(buffer, extension)) {
      return NextResponse.json(
        {
          success: false,
          message: "File content does not match the declared image type",
          code: "INVALID_FILE_CONTENT"
        },
        { status: 400 }
      );
    }

    // Validate MIME type as additional check
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          success: false,
          message: "File must be an image",
          code: "INVALID_MIME_TYPE"
        },
        { status: 400 }
      );
    }

    // Generate secure unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}-${randomString}.${extension}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file (buffer already created during validation)
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Return the public URL
    const url = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url,
        filename,
        size: file.size,
        type: extension
      }
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload image",
        error: (error as Error).message,
        code: "UPLOAD_ERROR"
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
