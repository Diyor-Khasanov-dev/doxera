import { NextResponse } from "next/server";
import { getFileFromCloudflareR2 } from "@/lib/cloudflareR2";

// GET /api/documents/download?key=...&filename=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const filename = searchParams.get("filename") || "document";

  if (!key) {
    return NextResponse.json({ error: "File key is required." }, { status: 400 });
  }

  try {
    const { body, contentType, originalName } = await getFileFromCloudflareR2(key);

    if (!body) {
      return NextResponse.json(
        { error: "File not found on Cloudflare R2 storage." },
        { status: 404 }
      );
    }

    const downloadName = originalName || filename;
    const mime = contentType || "application/octet-stream";

    const response = new NextResponse(Buffer.from(body), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadName)}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });

    return response;
  } catch (err) {
    console.error("Failed to download file from Cloudflare:", err);
    return NextResponse.json({ error: "Failed to fetch file from storage." }, { status: 500 });
  }
}
