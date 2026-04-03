import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    pinHash: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    deviceId: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    lastLogin: v.optional(v.number()),
  })
    .index("by_email", ["email"]),
});
