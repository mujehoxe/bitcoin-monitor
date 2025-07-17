import { NextRequest } from "next/server";

const PYTHON_SERVICE_URL = "http://localhost:8001";

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

    // Return error response instead of demo data
    return Response.json(
      { error: "Failed to fetch news", articles: [], totalArticles: 0 },
      { status: 500 }
    );
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

    // Return error response instead of demo data
    return Response.json(
      { error: "Failed to fetch news", articles: [], totalArticles: 0 },
      { status: 500 }
    );
  }
}
