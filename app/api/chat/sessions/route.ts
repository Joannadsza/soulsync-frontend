import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  "https://soulsync-backend-production-4df7.up.railway.app";

// GET all sessions
export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization");
  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }
  try {
    const response = await fetch(`${BACKEND_API_URL}/chat/sessions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

// POST create new session
export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization");
  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }
  try {
    const response = await fetch(`${BACKEND_API_URL}/chat/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}