import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new todo
export const createTodo = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not logged in");

    await ctx.db.insert("todos", {
      text: args.text,
      completed: false,
      userId: identity.subject,
    });
  },
});

// Get all todos
export const getTodos = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return ctx.db
      .query("todos")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();
  },
});

// Toggle the completed state of a todo
export const toggleTodo = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not logged in");

    const todo = await ctx.db.get(args.id);
    if (!todo || todo.userId !== identity.subject) return;

    await ctx.db.patch(args.id, { completed: !todo.completed });
  },
});

// Delete a todo (only if owned by the user)
export const deleteTodo = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not logged in");

    const todo = await ctx.db.get(args.id);
    if (!todo || todo.userId !== identity.subject) return;

    await ctx.db.delete(args.id);
  },
});
