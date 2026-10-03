import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { User } from "@/lib/types";
import { MOCK_USERS } from "@/lib/mockData";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureUsersExist(): User[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(MOCK_USERS, null, 2), "utf8");
      return MOCK_USERS;
    }
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    const parsed: User[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : MOCK_USERS;
  } catch (err) {
    console.error("Error reading users.json:", err);
    return MOCK_USERS;
  }
}

function saveUsers(users: User[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving users.json:", err);
  }
}

export async function GET() {
  const users = ensureUsersExist();
  return NextResponse.json({
    success: true,
    users,
    timestamp: Date.now(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || (!body.id && !body.email)) {
      return NextResponse.json({ success: false, error: "User id or email required" }, { status: 400 });
    }

    const users = ensureUsersExist();
    const existingIdx = users.findIndex(
      (u) => (body.id && u.id === body.id) || (body.email && u.email.toLowerCase() === body.email.toLowerCase())
    );

    let updatedUser: User;
    if (existingIdx >= 0) {
      updatedUser = { ...users[existingIdx], ...body };
      users[existingIdx] = updatedUser;
    } else {
      updatedUser = {
        id: body.id || `user-${Date.now()}`,
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        password: body.password || "9427717076",
        role: body.role || "team_member",
        department: body.department || "General",
        phone: body.phone || "",
        avatar: body.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        status: body.status || "active",
        permissions: body.permissions || { canViewAllTasks: false, departmentAccess: "own_department_only" },
        createdAt: body.createdAt || new Date().toISOString(),
      };
      users.push(updatedUser);
    }

    saveUsers(users);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      users,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("Users API POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");

    if (!id && !email) {
      return NextResponse.json({ success: false, error: "User id or email is required" }, { status: 400 });
    }

    const users = ensureUsersExist();
    const filtered = users.filter((u) => {
      if (id && u.id === id) return false;
      if (email && u.email.toLowerCase() === email.toLowerCase()) return false;
      return true;
    });

    saveUsers(filtered);

    return NextResponse.json({
      success: true,
      deletedId: id,
      users: filtered,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("Users API DELETE error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
