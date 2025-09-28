import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db/db";
import { users } from "../db/schema";
import { generateToken, verifyToken, hashPassword, verifyPassword } from "../utils/auth";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(2).max(255),
  phone: z.string().optional(),
  role: z.enum(["candidate", "recruiter"])
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1)
});

export const authRoute = new Hono()
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const { email, password, name, phone, role } = c.req.valid("json");
    
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    if (existingUser) {
      return c.json({ error: "User already exists" }, 400);
    }
    
    const passwordHash = await hashPassword(password);
    
    const [newUser] = await db.insert(users).values({
      email,
      passwordHash,
      name,
      phone,
      role
    }).returning();
    
    if (!newUser) {
      return c.json({ error: "Failed to create user" }, 500);
    }
    
    const token = await generateToken(newUser.id, newUser.email, newUser.role);
    
    setCookie(c, "auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60
    });
    
    return c.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  })
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }
    
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      return c.json({ error: "Invalid credentials" }, 401);
    }
    
    const token = await generateToken(user.id, user.email, user.role);
    
    setCookie(c, "auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60
    });
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  })
  .get("/me", async (c) => {
    const token = getCookie(c, "auth-token");
    
    if (!token) {
      return c.json({ error: "Not authenticated" }, 401);
    }
    
    try {
      const payload = await verifyToken(token);
      
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
        columns: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });
      
      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }
      
      return c.json({ user });
    } catch (error) {
      return c.json({ error: "Invalid token" }, 401);
    }
  })
  .post("/logout", (c) => {
    deleteCookie(c, "auth-token");
    return c.json({ message: "Logged out successfully" });
  });
