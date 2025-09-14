'use client';

import { useState } from 'react';
import { api } from '../../convex/_generated/api';
import {
  useQuery,
  useMutation,
  Authenticated,
  Unauthenticated,
} from 'convex/react';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import Link from 'next/link';
import { mcp } from 'webmcp-attributes';

type Filter = 'all' | 'active' | 'completed';

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 space-y-4">
          <h1 className="text-3xl font-semibold text-white">Todo</h1>
          <div className="flex gap-4">
            {user ? (
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link href="/sign-in">
                  <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition">
                    Sign in
                  </button>
                </Link>
                <Link href="/sign-up">
                  <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
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
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
        >
          Add
        </button>
      </form>

      <div className="flex justify-center gap-4 mb-6 text-sm text-gray-400">
        {(['all', 'active', 'completed'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`capitalize px-2 py-1 rounded ${
              f === filter
                ? 'bg-white text-black'
                : 'hover:text-white'
            } transition`}
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
            className="flex items-center justify-between border border-gray-700 bg-gray-800 rounded px-4 py-2 group hover:bg-gray-700 transition"
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
