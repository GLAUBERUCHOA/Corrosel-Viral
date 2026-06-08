import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireSystem } from "./auth";

export const getUserByEmail = query({
  args: {
    email: v.string(),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    requireSystem(args.secret);
    const cleanEmail = args.email.toLowerCase().trim();
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .unique();
  },
});

export const listUsers = query({
  args: {
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    requireSystem(args.secret);
    return await ctx.db
      .query("users")
      .order("desc")
      .collect();
  },
});

export const createUser = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.string(),
    password: v.optional(v.string()),
    role: v.string(),
    status: v.string(),
    hasCuradoriaAccess: v.optional(v.boolean()),
    isVerified: v.optional(v.boolean()),
    verificationCode: v.optional(v.string()),
    nicho: v.optional(v.string()),
    publicoAlvo: v.optional(v.string()),
    objetivo: v.optional(v.string()),
    cta: v.optional(v.string()),
    geminiApiKey: v.optional(v.string()),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    requireSystem(args.secret);
    const cleanEmail = args.email.toLowerCase().trim();

    // Verify uniqueness
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .unique();
    if (existing) {
      throw new Error("Email already in use");
    }

    const { secret, ...userData } = args;
    const userId = await ctx.db.insert("users", {
      ...userData,
      email: cleanEmail,
      createdAt: Date.now(),
    });

    const user = await ctx.db.get(userId);
    return user;
  },
});

export const updateUser = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    password: v.optional(v.string()),
    role: v.optional(v.string()),
    status: v.optional(v.string()),
    hasCuradoriaAccess: v.optional(v.boolean()),
    isVerified: v.optional(v.boolean()),
    verificationCode: v.optional(v.string()),
    nicho: v.optional(v.string()),
    publicoAlvo: v.optional(v.string()),
    objetivo: v.optional(v.string()),
    cta: v.optional(v.string()),
    geminiApiKey: v.optional(v.string()),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    requireSystem(args.secret);
    const { id, secret, ...updateFields } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("User not found");
    }

    // Clean up fields to update (remove undefined values)
    const patchData: Record<string, any> = {};
    for (const [key, val] of Object.entries(updateFields)) {
      if (val !== undefined) {
        if (key === "email") {
          patchData[key] = val.toLowerCase().trim();
        } else {
          patchData[key] = val;
        }
      }
    }

    // If verificationCode is explicitly cleared, we can pass it or delete it.
    // In Convex, setting verificationCode to undefined deletes it from the document,
    // which is what we want!

    await ctx.db.patch(id, patchData);
    return await ctx.db.get(id);
  },
});

export const deleteUser = mutation({
  args: {
    id: v.id("users"),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    requireSystem(args.secret);
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("User not found");
    }
    await ctx.db.delete(args.id);
    return true;
  },
});

export const upsertKiwifyUser = mutation({
  args: {
    email: v.string(),
    status: v.string(),
    hasCuradoriaAccess: v.optional(v.boolean()),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    requireSystem(args.secret);
    const cleanEmail = args.email.toLowerCase().trim();

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .unique();

    if (existing) {
      const patchData: Record<string, any> = {
        status: args.status,
      };
      if (args.hasCuradoriaAccess !== undefined) {
        patchData.hasCuradoriaAccess = args.hasCuradoriaAccess;
      }
      await ctx.db.patch(existing._id, patchData);
      return await ctx.db.get(existing._id);
    } else {
      const userId = await ctx.db.insert("users", {
        email: cleanEmail,
        status: args.status,
        role: "USER",
        hasCuradoriaAccess: args.hasCuradoriaAccess || false,
        isVerified: true,
        createdAt: Date.now(),
      });
      return await ctx.db.get(userId);
    }
  },
});
