import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseAndVerifySessionToken } from "@/lib/auth";
import { findLLCById, findLLCByUsername, updateLLC } from "@/lib/llcStore";
import {
  getDocumentsByLLC,
  createDocument,
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

// GET /api/portal/documents - List documents for current LLC
export async function GET(request: Request) {
  const llc = await getAuthenticatedLLC();
  if (!llc) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const sortBy = (searchParams.get("sortBy") as "creationDate" | "endDate" | "title" | "status") || undefined;
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || undefined;
  const status = searchParams.get("status") || undefined;

  const targetLLCId = llc.llcId || llc._id || "LLC-8801";
  const docs = await getDocumentsByLLC(targetLLCId, {
    search,
    sortBy,
    sortOrder,
    status,
  });

  return NextResponse.json({
    success: true,
    data: docs,
    total: docs.length,
  });
}

// POST /api/portal/documents - Create a new document
// Inputs required: creation date, document (title/name), and duration (10 years) OR end of the document (date)
export async function POST(request: Request) {
  const llc = await getAuthenticatedLLC();
  if (!llc) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, creationDate, expirationType, durationYears, endDate } = body;

    // Validate Title (Document Name)
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Document name / title is required." },
        { status: 400 }
      );
    }

    // Validate Creation Date (YYYY-MM-DD)
    if (!creationDate || !/^\d{4}-\d{2}-\d{2}$/.test(creationDate)) {
      return NextResponse.json(
        { error: "A valid creation date (YYYY-MM-DD) is required." },
        { status: 400 }
      );
    }

    // Validate Expiration Choice: either "duration" or "endDate"
    if (expirationType !== "duration" && expirationType !== "endDate") {
      return NextResponse.json(
        { error: "Must select either document duration or end date." },
        { status: 400 }
      );
    }

    let calculatedEndDate = endDate;
    let finalDurationYears: number | undefined = undefined;

    if (expirationType === "duration") {
      finalDurationYears = Number(durationYears) || 10;
      if (finalDurationYears <= 0) {
        return NextResponse.json(
          { error: "Duration must be greater than 0 years." },
          { status: 400 }
        );
      }
    } else {
      if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return NextResponse.json(
          { error: "A valid end date (YYYY-MM-DD) is required." },
          { status: 400 }
        );
      }
      calculatedEndDate = endDate;
    }

    const targetLLCId = llc.llcId || llc._id || "LLC-8801";

    const newDoc = await createDocument({
      llcId: targetLLCId,
      title: title.trim(),
      creationDate,
      expirationType,
      durationYears: finalDurationYears,
      endDate: calculatedEndDate || "",
      fileSize: "1.2 MB",
      fileFormat: "PDF",
    });

    // Optionally increment documentsCount on LLC profile
    const allLLCDocs = await getDocumentsByLLC(targetLLCId);
    await updateLLC(llc._id || llc.llcId, {
      documentsCount: allLLCDocs.length,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Document created successfully.",
        data: newDoc,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Creation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
