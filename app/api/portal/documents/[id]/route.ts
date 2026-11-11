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
async function getAuthenticatedLLC() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);

  if (!isValid || !payload) return null;

  if (payload.role === "llc") {
    let llc = null;
    if (payload.llcId) {
      llc = await findLLCById(payload.llcId);
    }
    if (!llc) {
      llc = await findLLCByUsername(payload.username);
    }
    return llc;
  }

  // Admin viewing LLC portal preview defaults to LLC-8801
  return (await findLLCById("LLC-8801")) || (await findLLCByUsername("apexdynamics"));
}

// GET /api/portal/documents/[id] - Get document by ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const llc = await getAuthenticatedLLC();
  if (!llc) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const targetLLCId = llc.llcId || llc._id || "LLC-8801";
  const doc = await findDocumentById(id, targetLLCId);

  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: doc });
}

// PUT /api/portal/documents/[id] - Modify document
// Task requirement: "and after creating it LLC can modify only that 3 data."
// That 3 data: creation date, document (title/name), and duration or end of the document (date).
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const llc = await getAuthenticatedLLC();
  if (!llc) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const targetLLCId = llc.llcId || llc._id || "LLC-8801";

  const existing = await findDocumentById(id, targetLLCId);
  if (!existing) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  try {
    const body = await request.json();

    // Whitelist ONLY the 3 allowed data fields:
    // 1. Document title/name
    // 2. Creation Date
    // 3. Duration OR End Date (and expirationType)
    const updates: {
      title?: string;
      creationDate?: string;
      expirationType?: "duration" | "endDate";
      durationYears?: number;
      endDate?: string;
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

    const updated = await updateDocument(id, targetLLCId, updates);
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
  const llc = await getAuthenticatedLLC();
  if (!llc) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const targetLLCId = llc.llcId || llc._id || "LLC-8801";

  const success = await deleteDocument(id, targetLLCId);
  if (!success) {
    return NextResponse.json({ error: "Document not found or could not be deleted." }, { status: 404 });
  }

  // Update documentsCount on LLC profile
  const allLLCDocs = await getDocumentsByLLC(targetLLCId);
  await updateLLC(llc._id || llc.llcId, {
    documentsCount: allLLCDocs.length,
  });

  return NextResponse.json({
    success: true,
    message: "Document deleted successfully.",
  });
}
