import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = new URLSearchParams();
  for (const key of ["query", "source", "prompt_version"]) {
    const value = url.searchParams.get(key);
    if (value) params.set(key, value);
  }

  try {
    const response = await fetch(`${ENGINE_URL}/reports?${params.toString()}`, { cache: "no-store" });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: `Could not reach FastAPI backend at ${ENGINE_URL}.` },
      { status: 502 }
    );
  }
}
