import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  "https://soulsync-backend-production-4df7.up.railway.app";

// GET session history
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const token = req.headers.get("Authorization");
  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }
  try {
    const { sessionId } = params;
    const response = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/history`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}