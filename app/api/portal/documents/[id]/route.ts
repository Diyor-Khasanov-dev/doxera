import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseAndVerifySessionToken } from "@/lib/auth";
import { findLLCById, findLLCByUsername, updateLLC } from "@/lib/llcStore";
import {
  findDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentsByLLC,
} from "@/lib/documentStore";
import { uploadFileToCloudflareR2 } from "@/lib/cloudflareR2";

// Helper to resolve currently authenticated LLC
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);

  if (!isValid || !payload) return null;
  return payload;
}

// GET /api/portal/documents/[id] - Get document by ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const targetLLCId = user.role === "llc" ? (user.llcId || "LLC-8801") : undefined;
  const doc = await findDocumentById(id, targetLLCId);

  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: doc });
}

// PUT /api/portal/documents/[id] - Modify document
// Requires a file (keeps existing or accepts replacement uploaded to Cloudflare R2)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const targetLLCId = user.role === "llc" ? (user.llcId || "LLC-8801") : undefined;

  const existing = await findDocumentById(id, targetLLCId);
  if (!existing) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, unknown> = {};
    let rawFileBuffer: Buffer | null = null;
    let rawMimeType = "application/octet-stream";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      body.title = formData.get("title");
      body.creationDate = formData.get("creationDate");
      body.expirationType = formData.get("expirationType");
      body.durationYears = formData.get("durationYears");
      body.endDate = formData.get("endDate");

      const file = formData.get("file") as File | null;
      if (file && typeof file === "object" && file.name) {
        body.fileName = file.name;
        body.fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        const ext = file.name.split(".").pop()?.toUpperCase() || "PDF";
        body.fileFormat = ext;
        rawMimeType = file.type || "application/octet-stream";
        rawFileBuffer = Buffer.from(await file.arrayBuffer());
      }
    } else {
      body = await request.json();
      if (body.fileUrl && typeof body.fileUrl === "string" && body.fileUrl.startsWith("data:")) {
        const parts = body.fileUrl.split(",");
        if (parts.length === 2) {
          const mimeMatch = parts[0].match(/:(.*?);/);
          if (mimeMatch) rawMimeType = mimeMatch[1];
          rawFileBuffer = Buffer.from(parts[1], "base64");
        }
      }
    }

    const updates: {
      title?: string;
      creationDate?: string;
      expirationType?: "duration" | "endDate";
      durationYears?: number;
      endDate?: string;
      fileName?: string;
      fileSize?: string;
      fileFormat?: string;
      fileUrl?: string;
      cloudflareKey?: string;
      storageType?: "cloudflare_r2" | "local_data_url";
    } = {};

    if (body.title !== undefined) {
      if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json({ error: "Document title cannot be empty." }, { status: 400 });
      }
      updates.title = body.title.trim();
    }

    if (body.creationDate !== undefined) {
      if (!body.creationDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.creationDate as string)) {
        return NextResponse.json(
          { error: "Valid creation date (YYYY-MM-DD) is required." },
          { status: 400 }
        );
      }
      updates.creationDate = body.creationDate as string;
    }

    if (body.expirationType !== undefined) {
      if (body.expirationType !== "duration" && body.expirationType !== "endDate") {
        return NextResponse.json(
          { error: "Expiration type must be either 'duration' or 'endDate'." },
          { status: 400 }
        );
      }
      updates.expirationType = body.expirationType;
    }

    if (updates.expirationType === "duration" || (!updates.expirationType && existing.expirationType === "duration")) {
      if (body.durationYears !== undefined) {
        const d = Number(body.durationYears);
        if (d <= 0) {
          return NextResponse.json({ error: "Duration must be greater than 0 years." }, { status: 400 });
        }
        updates.durationYears = d;
      }
    }

    if (updates.expirationType === "endDate" || (!updates.expirationType && existing.expirationType === "endDate")) {
      if (body.endDate !== undefined) {
        if (!body.endDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.endDate as string)) {
          return NextResponse.json({ error: "Valid end date (YYYY-MM-DD) is required." }, { status: 400 });
        }
        updates.endDate = body.endDate as string;
      }
    }

    // File validation: A file is required
    const hasExistingFile = Boolean(existing.fileName || existing.fileUrl);
    const hasNewFile = Boolean(body.fileName && rawFileBuffer);

    if (!hasExistingFile && !hasNewFile) {
      return NextResponse.json(
        { error: "A document file is required. Please upload a file." },
        { status: 400 }
      );
    }

    // If replacement file provided, upload to Cloudflare R2
    if (hasNewFile && rawFileBuffer) {
      const fileNameStr = String(body.fileName);
      const uploadResult = await uploadFileToCloudflareR2({
        buffer: rawFileBuffer,
        fileName: fileNameStr,
        contentType: rawMimeType,
        llcId: existing.llcId,
      });

      updates.fileName = fileNameStr.trim();
      updates.fileSize = body.fileSize ? String(body.fileSize).trim() : "1.2 MB";
      updates.fileFormat = body.fileFormat ? String(body.fileFormat).trim().toUpperCase() : "PDF";
      updates.fileUrl = uploadResult.fileUrl;
      updates.cloudflareKey = uploadResult.key;
      updates.storageType = uploadResult.storage;
    }

    const updated = await updateDocument(id, existing.llcId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update document." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Document updated successfully.",
      data: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/portal/documents/[id] - Delete a document
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const targetLLCId = user.role === "llc" ? (user.llcId || "LLC-8801") : undefined;

  const existing = await findDocumentById(id, targetLLCId);
  if (!existing) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const success = await deleteDocument(id, existing.llcId);
  if (!success) {
    return NextResponse.json({ error: "Document could not be deleted." }, { status: 500 });
  }

  // Update documentsCount on LLC profile
  const allLLCDocs = await getDocumentsByLLC(existing.llcId);
  const llcToUpdate = (await findLLCById(existing.llcId)) || (await findLLCByUsername(existing.llcId));
  if (llcToUpdate) {
    await updateLLC(llcToUpdate._id || llcToUpdate.llcId, {
      documentsCount: allLLCDocs.length,
    });
  }

  return NextResponse.json({
    success: true,
    message: "Document deleted successfully.",
  });
}
