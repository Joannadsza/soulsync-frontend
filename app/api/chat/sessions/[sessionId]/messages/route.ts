import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  "https://soulsync-backend-production-4df7.up.railway.app";

// POST send message
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const token = req.headers.get("Authorization");
  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }
  try {
    const { sessionId } = params;
    const body = await req.json();

    const response = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}