export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    technique: string;
    goal: string;
    progress: any[];
    analysis?: {
      emotionalState: string;
      themes: string[];
      riskLevel: number;
      recommendedApproach: string;
      progressIndicators: string[];
    };
  };
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  status?: "active" | "completed" | "archived";
  moodScore?: number;
}

export interface ApiResponse {
  message: string;
  response?: string;
  analysis?: {
    emotionalState: string;
    themes: string[];
    riskLevel: number;
    recommendedApproach: string;
    progressIndicators: string[];
    moodScore: number;
  };
  metadata?: {
    technique: string;
    goal: string;
    progress: any[];
  };
}

const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const createChatSession = async (): Promise<string> => {
  const response = await fetch(`/api/chat/sessions`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create chat session");
  }
  const data = await response.json();
  return data.sessionId;
};

export const sendChatMessage = async (
  sessionId: string,
  message: string
): Promise<ApiResponse> => {
  const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send message");
  }
  return response.json();
};

export const getChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  const response = await fetch(`/api/chat/sessions/${sessionId}/history`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch chat history");
  }
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Invalid chat history format");
  return data.map((msg: any) => ({
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    metadata: msg.metadata,
  }));
};

export const getAllChatSessions = async (): Promise<ChatSession[]> => {
  const response = await fetch(`/api/chat/sessions`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch chat sessions");
  }
  const data = await response.json();
  return data.map((session: any) => {
    const createdAt = new Date(session.createdAt || Date.now());
    const updatedAt = new Date(session.updatedAt || Date.now());
    return {
      ...session,
      createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt,
      updatedAt: isNaN(updatedAt.getTime()) ? new Date() : updatedAt,
      messages: (session.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp || Date.now()),
      })),
    };
  });
};

export const analyseSession = async (sessionId: string): Promise<ApiResponse["analysis"]> => {
  const response = await fetch(`/api/chat/sessions/${sessionId}/analyse`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to analyse session");
  }
  const data = await response.json();
  return data.analysis;
};