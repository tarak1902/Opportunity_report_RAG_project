import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${ENGINE_URL}/prompt-config`, { cache: "no-store" });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: `Could not reach FastAPI backend at ${ENGINE_URL}.` },
      { status: 502 }
    );
  }
}

export async function PUT(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  try {
    const response = await fetch(`${ENGINE_URL}/prompt-config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: `Could not reach FastAPI backend at ${ENGINE_URL}.` },
      { status: 502 }
    );
  }
}
