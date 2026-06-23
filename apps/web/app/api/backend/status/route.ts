import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${ENGINE_URL}/backend/status`, { cache: "no-store" });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: `Could not reach FastAPI backend at ${ENGINE_URL}.` },
      { status: 502 }
    );
  }
}
