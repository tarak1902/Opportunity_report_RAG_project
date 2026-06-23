import { NextResponse } from "next/server";

type GenerateReportRequest = {
  topic?: string;
};

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  let payload: GenerateReportRequest;

  try {
    payload = (await request.json()) as GenerateReportRequest;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const topic = payload.topic?.trim();
  if (!topic) {
    return NextResponse.json({ error: "Topic is required." }, { status: 400 });
  }

  try {
    const response = await fetch(`${ENGINE_URL}/generate-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
      cache: "no-store"
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail ?? "Backend report generation failed." },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: `Could not reach FastAPI backend at ${ENGINE_URL}. Start the engine on port 8000.` },
      { status: 502 }
    );
  }
}
