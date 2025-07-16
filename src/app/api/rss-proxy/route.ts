import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Validate URL to prevent SSRF
    const rssUrl = new URL(url);
    if (!["http:", "https:"].includes(rssUrl.protocol)) {
      throw new Error("Invalid protocol");
    }

    // List of allowed RSS domains
    const allowedDomains = [
      "cointelegraph.com",
      "coindesk.com",
      "reuters.com",
      "theguardian.com",
    ];

    const domain = rssUrl.hostname.replace("www.", "");
    const isAllowed = allowedDomains.some((allowed) =>
      domain.includes(allowed)
    );

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Domain not allowed" },
        { status: 403 }
      );
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Bitcoin-Monitor/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`RSS feed error: ${response.status}`);
    }

    const xmlText = await response.text();

    return new NextResponse(xmlText, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("RSS proxy error:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch RSS: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
