'use client';

import { useState } from 'react';
import { api } from '../../convex/_generated/api';
import {
  useQuery,
  useMutation,
  Authenticated,
  Unauthenticated,
} from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import Link from 'next/link';
import { mcp } from 'webmcp-attributes';

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
          <p className="text-white text-lg font-medium">Loading your todos...</p>
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

  const [text, setText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    await createTodo({ text: trimmed });
    setText('');
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'all') return true;
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
  });

  return (
    <>
      <form
        onSubmit={handleAdd}
        className="flex gap-2 mb-6"
        {...mcp.tool('add-todo', 'Add a new todo item to the list')}
      >
        <input
          name="text"
          type="text"
          className="flex-1 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white transition"
          placeholder="Add a new task"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setText('');
          }}
          {...mcp.param('The text content for the new todo item', {
            type: 'string',
            required: true,
            min: 1,
            max: 100,
          })}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] transition"
        >
          Add
        </button>
      </form>

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
            {...mcp.tool(`filter-todos-${f}`, `Show ${f} todos in the list`)}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filteredTodos.map((todo) => (
          <li
            key={todo._id}
            className="flex items-center justify-between border border-gray-700 bg-gray-800 rounded px-4 py-2 group hover:bg-gray-700 hover:shadow-[0_0_12px_rgba(255,255,255,0.1)] transition"
          >
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => toggleTodo({ id: todo._id })}
              {...mcp.tool('toggle-todo', 'Toggle completion status of a todo item')}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                readOnly
                className="form-checkbox h-4 w-4 text-white bg-gray-900 border-gray-600"
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
            </div>

            <button
              onClick={() => deleteTodo({ id: todo._id })}
              className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
              {...mcp.tool('delete-todo', 'Delete a specific todo item')}
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
