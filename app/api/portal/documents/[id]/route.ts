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
// Allows modifying title, creationDate, duration / endDate, AND attached file (fileName, fileSize, fileFormat, fileUrl)
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
    const body = await request.json();

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
    } = {};

    if (body.title !== undefined) {
      if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json({ error: "Document title cannot be empty." }, { status: 400 });
      }
      updates.title = body.title.trim();
    }

    if (body.creationDate !== undefined) {
      if (!body.creationDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.creationDate)) {
        return NextResponse.json(
          { error: "Valid creation date (YYYY-MM-DD) is required." },
          { status: 400 }
        );
      }
      updates.creationDate = body.creationDate;
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
        if (!body.endDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.endDate)) {
          return NextResponse.json({ error: "Valid end date (YYYY-MM-DD) is required." }, { status: 400 });
        }
        updates.endDate = body.endDate;
      }
    }

    // File integration updates
    if (body.fileName !== undefined) {
      updates.fileName = body.fileName ? String(body.fileName).trim() : "";
    }
    if (body.fileSize !== undefined) {
      updates.fileSize = body.fileSize ? String(body.fileSize).trim() : "";
    }
    if (body.fileFormat !== undefined) {
      updates.fileFormat = body.fileFormat ? String(body.fileFormat).trim().toUpperCase() : "";
    }
    if (body.fileUrl !== undefined) {
      updates.fileUrl = body.fileUrl ? String(body.fileUrl) : "";
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
