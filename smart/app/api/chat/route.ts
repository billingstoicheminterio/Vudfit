import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ChatMessage } from "@/lib/types";
import { MOCK_CHAT_MESSAGES } from "@/lib/mockData";

const DATA_DIR = path.join(process.cwd(), "data");
const CHAT_FILE = path.join(DATA_DIR, "chat_messages.json");

function ensureFileExists(): ChatMessage[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CHAT_FILE)) {
      fs.writeFileSync(CHAT_FILE, JSON.stringify(MOCK_CHAT_MESSAGES, null, 2), "utf8");
      return MOCK_CHAT_MESSAGES;
    }
    const raw = fs.readFileSync(CHAT_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading chat_messages.json:", err);
    return MOCK_CHAT_MESSAGES;
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CHAT_FILE, JSON.stringify(messages, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving chat_messages.json:", err);
  }
}

export async function GET() {
  const messages = ensureFileExists();
  return NextResponse.json({
    success: true,
    messages,
    timestamp: Date.now(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || (!body.content && !body.imageUrl)) {
      return NextResponse.json({ success: false, error: "Empty message" }, { status: 400 });
    }

    const messages = ensureFileExists();

    const newMsg: ChatMessage = {
      id: body.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId: body.senderId,
      senderName: body.senderName,
      senderAvatar: body.senderAvatar || "",
      senderEmail: body.senderEmail,
      receiverId: body.receiverId,
      receiverEmail: body.receiverEmail,
      channelId: body.channelId,
      content: (body.content || "").trim(),
      imageUrl: body.imageUrl,
      isRead: false,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    // Avoid duplicate message IDs if already posted
    const existingIndex = messages.findIndex((m) => m.id === newMsg.id);
    if (existingIndex >= 0) {
      messages[existingIndex] = newMsg;
    } else {
      messages.push(newMsg);
    }

    saveMessages(messages);

    return NextResponse.json({
      success: true,
      message: newMsg,
      messages,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("Chat API POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = ensureFileExists();
    let updated = false;

    messages.forEach((m) => {
      const isTarget =
        (m.receiverId === body.userId || (body.userEmail && m.receiverEmail?.toLowerCase() === body.userEmail.toLowerCase())) &&
        (m.senderId === body.partnerId || (body.partnerEmail && m.senderEmail?.toLowerCase() === body.partnerEmail.toLowerCase()));

      if (isTarget && !m.isRead) {
        m.isRead = true;
        updated = true;
      }
    });

    if (updated) {
      saveMessages(messages);
    }

    return NextResponse.json({ success: true, messages, timestamp: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
