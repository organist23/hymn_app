import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Helper: simple SHA-256 hash (runs server-side) ───
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "_hymn_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Create User (Admin only) ───
export const createUser = mutation({
  args: {
    email: v.string(),
    pin: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    adminUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check: caller must be admin
    const admin = await ctx.db.get(args.adminUserId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Only admins can create users.");
    }

    // Check: PIN must be exactly 6 digits
    if (!/^\d{6}$/.test(args.pin)) {
      throw new Error("PIN must be exactly 6 digits.");
    }

    // Check: email can't already exist
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();
    if (existing) {
      throw new Error("A user with this email already exists.");
    }

    const pinHash = await hashPin(args.pin);

    return await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      pinHash,
      role: args.role,
      deviceId: undefined,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// ─── Login ───
export const login = mutation({
  args: {
    email: v.string(),
    pin: v.string(),
    deviceId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();

    if (!user) {
      throw new Error("Invalid email or PIN.");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated. Contact your admin.");
    }

    // Verify PIN
    const pinHash = await hashPin(args.pin);
    if (pinHash !== user.pinHash) {
      throw new Error("Invalid email or PIN.");
    }

    // Device lock check
    if (user.deviceId && user.deviceId !== args.deviceId) {
      throw new Error(
        "This account is locked to another device. Contact your admin to reset."
      );
    }

    // Bind device on first login, update lastLogin
    await ctx.db.patch(user._id, {
      deviceId: args.deviceId,
      lastLogin: Date.now(),
    });

    return {
      userId: user._id,
      email: user.email,
      role: user.role,
    };
  },
});

// ─── Validate Session ───
export const validateSession = query({
  args: {
    userId: v.id("users"),
    deviceId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { valid: false, reason: "User not found." };
    if (!user.isActive) return { valid: false, reason: "Account deactivated." };
    if (user.deviceId !== args.deviceId)
      return { valid: false, reason: "Device mismatch." };

    return {
      valid: true,
      email: user.email,
      role: user.role,
    };
  },
});

// ─── List Users (Admin only) ───
export const listUsers = query({
  args: {
    adminUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminUserId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Only admins can list users.");
    }

    return await ctx.db.query("users").collect();
  },
});

// ─── Delete User (Admin only) ───
export const deleteUser = mutation({
  args: {
    adminUserId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminUserId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Only admins can delete users.");
    }

    // Can't delete yourself
    if (args.adminUserId === args.targetUserId) {
      throw new Error("You cannot delete your own account.");
    }

    await ctx.db.delete(args.targetUserId);
    return { success: true };
  },
});

// ─── Reset Device (Admin only) ───
export const resetDevice = mutation({
  args: {
    adminUserId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminUserId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Only admins can reset devices.");
    }

    await ctx.db.patch(args.targetUserId, {
      deviceId: undefined,
    });

    return { success: true };
  },
});

// ─── Update User PIN (Admin only) ───
export const updateUserPin = mutation({
  args: {
    adminUserId: v.id("users"),
    targetUserId: v.id("users"),
    newPin: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminUserId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Only admins can update user PINs.");
    }

    if (!/^\d{6}$/.test(args.newPin)) {
      throw new Error("PIN must be exactly 6 digits.");
    }

    const pinHash = await hashPin(args.newPin);
    await ctx.db.patch(args.targetUserId, { pinHash });

    return { success: true };
  },
});

// ─── Seed Admin (run once from Convex dashboard) ───
export const seedAdmin = mutation({
  args: {
    email: v.string(),
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    // Only works if no users exist yet
    const allUsers = await ctx.db.query("users").collect();
    if (allUsers.length > 0) {
      throw new Error("Admin already exists. Use the admin panel to create users.");
    }

    if (!/^\d{6}$/.test(args.pin)) {
      throw new Error("PIN must be exactly 6 digits.");
    }

    const pinHash = await hashPin(args.pin);

    return await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      pinHash,
      role: "admin",
      deviceId: undefined,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});
