import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const authRoute = new Hono()
  .get("/login", async (c) => {})
  .get("/register", async (c) => {})
  .get("/callback", async (c) => {
    // this will get called whenever I'll login or register
  })
  .get("/logout", async (c) => {})
  .get("/me", async (c) => {});
