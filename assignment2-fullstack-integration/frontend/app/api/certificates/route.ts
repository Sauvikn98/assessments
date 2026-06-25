import { NextResponse } from 'next/server';

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || "https://localhost:8443";
  // Explicitly ignore cert errors for development
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  try {
    const res = await fetch(`${backendUrl}/certificates`, {
      headers: { "Accept": "application/json" }
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const backendUrl = process.env.BACKEND_URL || "https://localhost:8443";
  // Explicitly ignore cert errors for development
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  try {
    const body = await req.json();
    const res = await fetch(`${backendUrl}/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
