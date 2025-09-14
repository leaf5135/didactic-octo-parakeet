'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState } from 'react';
import { mcp } from 'webmcp-attributes';

type Filter = 'all' | 'active' | 'completed';

export default function Home() {
  const todos = useQuery(api.todo.getTodos) ?? [];
  const createTodo = useMutation(api.todo.createTodo);
  const toggleTodo = useMutation(api.todo.toggleTodo);
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
    <main className="min-h-screen bg-white flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-md">
      <h1 className="text-3xl font-semibold mb-6 text-center text-black">
        Todo
      </h1>

      <form 
        action="/api/todos"
        method="POST"
        onSubmit={handleAdd} 
        className="flex gap-2 mb-6" 
        {...mcp.tool('add-todo', 'Add a new todo item to the list')}
      >
        <input
          name="text"
          type="text"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-black placeholder-700 focus:outline-none focus:ring-2 focus:ring-black transition"
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
            max: 100
          })}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white rounded hover:bg-neutral-800 transition"
        >
          Add
        </button>
      </form>


        {/* Filter Buttons */}
        <div className="flex justify-center gap-4 mb-6 text-sm text-gray-600">
          {(['all', 'active', 'completed'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`capitalize px-2 py-1 rounded ${
                f === filter ? 'bg-black text-white' : 'hover:text-black'
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
              className="flex items-center justify-between border border-gray-200 rounded px-4 py-2 group hover:bg-gray-50 transition"
            >
              <form
                action="/api/todos/toggle"
                method="POST"
                onSubmit={(e) => e.preventDefault()}
                className="flex items-center gap-2 cursor-pointer"
                {...mcp.tool('toggle-todo', 'Toggle completion status of a todo item')}
              >
                <input
                  name="id"
                  type="hidden"
                  value={todo._id}
                  {...mcp.param('ID of the todo to toggle', {
                    type: 'string',
                    required: true
                  })}
                />
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={(e) => e.preventDefault()}
                  className="form-checkbox h-4 w-4 text-black"
                />
                <span
                  className={`${
                    todo.completed ? 'line-through text-gray-400' : 'text-gray-800'
                  }`}
                >
                  {todo.text}
                </span>
              </form>

              <form
                action="/api/todos/delete"
                method="POST"
                onSubmit={(e) => e.preventDefault()}
                className="inline"
                {...mcp.tool('delete-todo', 'Delete a specific todo item')}
              >
                <input
                  name="id"
                  type="hidden"
                  value={todo._id}
                  {...mcp.param('ID of the todo to delete', {
                    type: 'string',
                    required: true
                  })}
                />
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                >
                  &times;
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
