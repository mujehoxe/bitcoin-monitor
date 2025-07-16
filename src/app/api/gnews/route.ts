import { NextRequest } from "next/server";

const PYTHON_SERVICE_URL = "http://localhost:8000";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "bitcoin";
  const query = searchParams.get("q") || "bitcoin";

  try {
    const url = `${PYTHON_SERVICE_URL}/${type}?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Python service error: ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error fetching from Python gnews service:", error);

    // Return demo data as fallback
    const demoData = getDemoData(type);
    return Response.json(demoData);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type = "bitcoin" } = body;

    const url = PYTHON_SERVICE_URL;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, type }),
    });

    if (!response.ok) {
      throw new Error(`Python service error: ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error posting to Python gnews service:", error);

    // Return demo data as fallback
    const demoData = getDemoData("bitcoin");
    return Response.json(demoData);
  }
}

function getDemoData(type: string) {
  const now = new Date();

  if (type === "bitcoin") {
    return {
      articles: [
        {
          id: `gnews-${type}-demo-1`,
          title:
            "Bitcoin Reaches New All-Time High Amid Institutional Adoption",
          description:
            "Bitcoin surges past $70,000 as major corporations announce Bitcoin treasury additions.",
          content:
            "The cryptocurrency market sees unprecedented institutional interest...",
          publishedAt: now.toISOString(),
          source: "GNews Python",
          url: "https://example.com/bitcoin-news-1",
          author: "GNews Python",
          urlToImage: null,
        },
        {
          id: `gnews-${type}-demo-2`,
          title: "Global Bank Launches Bitcoin Custody Services",
          description:
            "Leading international bank introduces comprehensive Bitcoin custody solutions...",
          content:
            "The new service provides secure storage and management of Bitcoin assets...",
          publishedAt: new Date(now.getTime() - 3600000).toISOString(),
          source: "GNews Python",
          url: "https://example.com/bitcoin-news-2",
          author: "GNews Python",
          urlToImage: null,
        },
      ],
      totalArticles: 2,
      source: "gnews-python-demo",
    };
  }

  return {
    articles: [
      {
        id: `gnews-${type}-demo-1`,
        title: "Ethereum Layer 2 Solutions See Explosive Growth",
        description:
          "Ethereum's Layer 2 scaling solutions are experiencing unprecedented adoption rates.",
        content:
          "Recent data shows that Layer 2 solutions are processing more transactions than ever...",
        publishedAt: now.toISOString(),
        source: "GNews Python",
        url: "https://example.com/crypto-news-1",
        author: "GNews Python",
        urlToImage: null,
      },
    ],
    totalArticles: 1,
    source: "gnews-python-demo",
  };
}
