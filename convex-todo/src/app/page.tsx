'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';
import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
  useMutation,
  useQuery,
} from 'convex/react';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

type Filter = 'all' | 'active' | 'completed';

export default function Home() {
  const { user, signOut } = useAuth();
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-900 via-gray-900 to-blue-900 opacity-60"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-700 opacity-30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-700 opacity-30 rounded-full blur-3xl animate-pulse"></div>

        {/* Spinner */}
        <div className="flex flex-col items-center space-y-4 z-10">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen text-white flex flex-col items-center justify-center px-4 py-10 overflow-hidden bg-gray-900">
      {/* Glowing background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-900 via-gray-900 to-blue-900 opacity-60"></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-700 opacity-30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-700 opacity-30 rounded-full blur-3xl animate-pulse"></div>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-6 space-y-4">
          <h1 className="text-3xl font-semibold text-white">Todo</h1>
          <div className="flex gap-4">
            {user && isAuthenticated ? (
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] transition"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link href="/sign-in">
                  <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition">
                    Sign in
                  </button>
                </Link>
                <Link href="/sign-up">
                  <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition">
                    Sign up
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>

        <Authenticated>
          <TodoApp />
        </Authenticated>

        <Unauthenticated>
          <p className="text-center text-gray-400">
            Please sign in to view your todos.
          </p>
        </Unauthenticated>
      </div>
    </main>
  );
}

function TodoApp() {
  const todos = useQuery(api.todo.getTodos) ?? [];
  const createTodo = useMutation(api.todo.createTodo);
  const toggleTodo = useMutation(api.todo.toggleTodo);
  const deleteTodo = useMutation(api.todo.deleteTodo);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [filter, setFilter] = useState<Filter>('all');

  const todoExists = (id: string) => todos.some((todo) => todo._id === id);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const text = formData.get('text') as string;
    if (!text.trim()) return;
    await createTodo({ text: text.trim() });
    form.reset();
  };

  const handleToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const id = formData.get('id') as string;
    if (!todoExists(id)) return;
    await toggleTodo({ id: id as Id<"todos"> });
    form.reset();
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const id = formData.get('id') as string;
    if (!todoExists(id)) return;
    await deleteTodo({ id: id as Id<"todos"> });
    form.reset();
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'all') return true;
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
  });

  return (
    <>
      {/* MCP-Compatible Add Todo Form */}
      <form
        tool-name="todo.create"
        tool-description="Create a new Todo item"
        onSubmit={handleAdd}
        className="flex gap-2 mb-6"
      >
        <input
          name="text"
          type="text"
          placeholder="Add a new task"
          tool-param-type="string"
          tool-param-description="Text of the new todo"
          required
          className="flex-1 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white transition"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
        >
          Add
        </button>
      </form>

      {/* MCP-Compatible Toggle Todo Form */}
      <form
        tool-name="todo.toggle"
        tool-description="Toggle a Todo by ID"
        onSubmit={handleToggle}
        className="hidden"
      >
        <input
          name="id"
          type="text"
          placeholder="Enter todo ID to toggle"
          tool-param-type="string"
          tool-param-description="ID of the todo to toggle"
          required
          className="flex-1 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded px-3 py-2"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
        >
          Toggle
        </button>
      </form>

      {/* MCP-Compatible Delete Todo Form */}
      <form
        tool-name="todo.delete"
        tool-description="Delete a Todo by ID"
        onSubmit={handleDelete}
        className="hidden"
      >
        <input
          name="id"
          type="text"
          placeholder="Enter todo ID to delete"
          tool-param-type="string"
          tool-param-description="ID of the todo to delete"
          required
          className="flex-1 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded px-3 py-2"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-600 transition"
        >
          Delete
        </button>
      </form>

      {/* Filter Buttons */}
      <div className="flex justify-center gap-4 mb-6 text-sm text-gray-400">
        {(['all', 'active', 'completed'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`capitalize px-2 py-1 rounded transition ${
              f === filter
                ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                : 'hover:text-white'
            }`}
            tool-name={`filter-todos-${f}`}
            tool-description={`Show ${f} todos in the list`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Todo List */}
      <ul className="space-y-2">
        {filteredTodos.map((todo) => (
          <li
            key={todo._id}
            className="flex items-center justify-between border border-gray-700 bg-gray-800 rounded px-4 py-2 group hover:bg-gray-700 hover:shadow-[0_0_12px_rgba(255,255,255,0.1)] transition"
          >
            <form
              onSubmit={handleToggle}
              className="flex items-center gap-2 flex-1"
              tool-name={`toggle-todo-${todo._id}`}
              tool-description={`Toggle completion status of todo: ${todo.text}`}
            >
              <input type="hidden" name="id" value={todo._id} tool-param-description="The ID of the todo item to toggle" />
              <button
                type="submit"
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  readOnly
                  className="form-checkbox h-4 w-4 text-white bg-gray-900 border-gray-600 pointer-events-none"
                />
                <span
                  className={`${
                    todo.completed
                      ? 'line-through text-gray-500'
                      : 'text-white'
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(todo._id);
                    setCopiedId(todo._id);
                    setTimeout(() => setCopiedId(null), 1500); // Clear after 1.5s
                  }}
                  title="Click to copy ID"
                  className={`text-xs mt-1 transition ${
                    copiedId === todo._id
                      ? 'text-green-400'
                      : 'text-gray-400 hover:text-white underline underline-offset-2 decoration-dotted'
                  }`}
                >
                  {copiedId === todo._id ? 'Copied!' : `ID: ${todo._id}`}
                </button>
              </button>
            </form>

            <form
              onSubmit={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition"
              tool-name={`delete-todo-${todo._id}`}
              tool-description={`Delete todo: ${todo.text}`}
            >
              <input type="hidden" name="id" value={todo._id} />
              <button
                type="submit"
                className="text-gray-400 hover:text-red-500 transition"
              >
                &times;
              </button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
