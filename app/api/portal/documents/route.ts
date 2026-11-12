import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseAndVerifySessionToken } from "@/lib/auth";
import { findLLCById, findLLCByUsername, updateLLC } from "@/lib/llcStore";
import {
  getDocumentsByLLC,
  createDocument,
} from "@/lib/documentStore";
import { uploadFileToCloudflareR2 } from "@/lib/cloudflareR2";

// Helper to resolve currently authenticated LLC
async function getAuthenticatedLLC(request?: Request, targetLlcId?: string) {
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

  // Admin user can view/manage specific LLC by targetLlcId or query param
  if (payload.role === "admin") {
    let llcIdToLookup = targetLlcId;
    if (!llcIdToLookup && request) {
      const url = new URL(request.url);
      llcIdToLookup = url.searchParams.get("llcId") || undefined;
    }
    if (llcIdToLookup) {
      const target = await findLLCById(llcIdToLookup);
      if (target) return target;
    }
    // Fallback default for admin portal preview
    return (await findLLCById("LLC-8801")) || (await findLLCByUsername("apexdynamics"));
  }

  return null;
}

// GET /api/portal/documents - List documents for current LLC (or target LLC if admin)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetLlcId = searchParams.get("llcId") || undefined;

  const llc = await getAuthenticatedLLC(request, targetLlcId);
  if (!llc) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = searchParams.get("search") || undefined;
  const sortBy = (searchParams.get("sortBy") as "creationDate" | "endDate" | "title" | "status") || undefined;
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || undefined;
  const status = searchParams.get("status") || undefined;

  const resolvedLLCId = targetLlcId || llc.llcId || llc._id || "LLC-8801";
  const docs = await getDocumentsByLLC(resolvedLLCId, {
    search,
    sortBy,
    sortOrder,
    status,
  });

  return NextResponse.json({
    success: true,
    data: docs,
    total: docs.length,
    llc: {
      companyName: llc.companyName,
      llcId: resolvedLLCId,
    },
  });
}

// POST /api/portal/documents - Create a new document with REQUIRED file saved to Cloudflare R2
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let title = "";
    let creationDate = "";
    let expirationType: "duration" | "endDate" = "duration";
    let durationYears = 10;
    let endDate = "";
    let fileName = "";
    let fileSize = "";
    let fileFormat = "";
    let rawFileBuffer: Buffer | null = null;
    let rawMimeType = "application/octet-stream";
    let explicitLlcId: string | undefined = undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      title = (formData.get("title") as string) || "";
      creationDate = (formData.get("creationDate") as string) || "";
      expirationType = ((formData.get("expirationType") as string) || "duration") as "duration" | "endDate";
      durationYears = Number(formData.get("durationYears")) || 10;
      endDate = (formData.get("endDate") as string) || "";
      explicitLlcId = (formData.get("llcId") as string) || undefined;

      const file = formData.get("file") as File | null;
      if (file && typeof file === "object" && file.name) {
        fileName = file.name;
        fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        const ext = file.name.split(".").pop()?.toUpperCase() || "PDF";
        fileFormat = ext;
        rawMimeType = file.type || "application/octet-stream";
        rawFileBuffer = Buffer.from(await file.arrayBuffer());
      }
    } else {
      const body = await request.json();
      title = body.title || "";
      creationDate = body.creationDate || "";
      expirationType = body.expirationType || "duration";
      durationYears = Number(body.durationYears) || 10;
      endDate = body.endDate || "";
      fileName = body.fileName || "";
      fileSize = body.fileSize || "";
      fileFormat = body.fileFormat || "";
      explicitLlcId = body.llcId || undefined;

      // Check if fileUrl is a data URL
      if (body.fileUrl && typeof body.fileUrl === "string" && body.fileUrl.startsWith("data:")) {
        const parts = body.fileUrl.split(",");
        if (parts.length === 2) {
          const mimeMatch = parts[0].match(/:(.*?);/);
          if (mimeMatch) rawMimeType = mimeMatch[1];
          rawFileBuffer = Buffer.from(parts[1], "base64");
        }
      }
    }

    const llc = await getAuthenticatedLLC(request, explicitLlcId);
    if (!llc) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validation: Title
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Document name / title is required." },
        { status: 400 }
      );
    }

    // Validation: File upload is REQUIRED per prompt requirement
    if (!fileName || !rawFileBuffer) {
      return NextResponse.json(
        { error: "Uploading a document file is required. Please attach a file." },
        { status: 400 }
      );
    }

    // Validation: Creation Date
    if (!creationDate || !/^\d{4}-\d{2}-\d{2}$/.test(creationDate)) {
      return NextResponse.json(
        { error: "A valid creation date (YYYY-MM-DD) is required." },
        { status: 400 }
      );
    }

    // Validation: Expiration Type
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

    const targetLLCId = explicitLlcId || llc.llcId || llc._id || "LLC-8801";

    // Save exact file to Cloudflare R2
    const uploadResult = await uploadFileToCloudflareR2({
      buffer: rawFileBuffer,
      fileName,
      contentType: rawMimeType,
      llcId: targetLLCId,
    });

    const newDoc = await createDocument({
      llcId: targetLLCId,
      title: title.trim(),
      creationDate,
      expirationType,
      durationYears: finalDurationYears,
      endDate: calculatedEndDate || "",
      fileName: fileName.trim(),
      fileSize: fileSize || "1.2 MB",
      fileFormat: fileFormat ? fileFormat.trim().toUpperCase() : "PDF",
      fileUrl: uploadResult.fileUrl,
      cloudflareKey: uploadResult.key,
      storageType: uploadResult.storage,
    });

    // Update documentsCount on LLC profile
    const allLLCDocs = await getDocumentsByLLC(targetLLCId);
    await updateLLC(llc._id || llc.llcId, {
      documentsCount: allLLCDocs.length,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Document created and saved to storage successfully.",
        data: newDoc,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
