import React from 'react';
import { mcp } from 'webmcp-attributes';
import { getTodos, type Todo } from '../lib/todos';

export default function TodoApp() {
  const todos = getTodos();
  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);


  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Todo App with WebMCP (Server-Side Rendered)</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        This page is fully server-side rendered with MCP attributes in the HTML.
      </p>
      
      {/* Add Todo Form with MCP attributes */}
      <form 
        action="/api/todos"
        method="POST"
        style={{ marginBottom: '20px' }}
        {...mcp.tool('add-todo', 'Add a new todo item to the list')}
      >
        <input
          name="text"
          type="text"
          placeholder="What needs to be done?"
          required
          style={{ 
            padding: '10px', 
            fontSize: '16px', 
            borderRadius: '4px', 
            border: '1px solid #ddd',
            marginRight: '10px',
            minWidth: '300px'
          }}
          {...mcp.param('The text content for the new todo item', {max: 100, min: 1, type: 'string', required: true})}
        />
        <button 
          type="submit"
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add Todo
        </button>
      </form>

      {/* Filter Links with MCP attributes */}
      <div style={{ marginBottom: '20px' }}>
        <a 
          href="/todos/all"
          style={{ 
            marginRight: '10px', 
            color: '#007bff',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
          {...mcp.tool('show-all-todos', 'Show all todos regardless of completion status')}
        >
          All ({todos.length})
        </a>
        <a 
          href="/todos/active"
          style={{ 
            marginRight: '10px', 
            color: '#666',
            textDecoration: 'none'
          }}
          {...mcp.tool('show-active-todos', 'Show only incomplete todos')}
        >
          Active ({activeTodos.length})
        </a>
        <a 
          href="/todos/completed"
          style={{ 
            color: '#666',
            textDecoration: 'none'
          }}
          {...mcp.tool('show-completed-todos', 'Show only completed todos')}
        >
          Completed ({completedTodos.length})
        </a>
      </div>

      {/* Todo List - All todos shown (no client-side filtering) */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map(todo => (
          <li 
            key={todo.id} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '10px',
              borderBottom: '1px solid #eee'
            }}
          >
            {/* Toggle Todo Form */}
            <form 
              action="/api/todos/toggle"
              method="POST"
              style={{ marginRight: '10px' }}
              {...mcp.tool('toggle-todo', 'Toggle completion status of a todo item')}
            >
              <input 
                type="hidden" 
                name="id" 
                value={todo.id} 
                {...mcp.param('ID of the todo to toggle', {
                  type: 'number',
                  required: true
                })} 
              />
              <button
                type="submit"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                {todo.completed ? '✓' : '○'}
              </button>
            </form>

            <span 
              style={{ 
                flex: 1, 
                textDecoration: todo.completed ? 'line-through' : 'none',
                color: todo.completed ? '#999' : '#000'
              }}
            >
              {todo.text}
            </span>

            {/* Delete Todo Form */}
            <form 
              action="/api/todos/delete"
              method="POST"
              style={{ display: 'inline' }}
              {...mcp.tool('delete-todo', 'Delete a specific todo item')}
            >
              <input 
                type="hidden" 
                name="id" 
                value={todo.id}
                {...mcp.param('ID of the todo to delete', {
                  type: 'number', 
                  required: true
                })}
              />
              <button
                type="submit"
                style={{ 
                  background: 'none',
                  border: 'none',
                  color: '#dc3545',
                  textDecoration: 'underline',
                  marginLeft: '10px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </form>
          </li>
        ))}
      </ul>

      {/* Clear Completed Form */}
      {completedTodos.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <form 
            action="/api/todos/clear-completed"
            method="POST"
            style={{ display: 'inline' }}
            {...mcp.tool('clear-completed', 'Remove all completed todos from the list')}
          >
            <button
              type="submit"
              style={{ 
                background: 'none',
                border: 'none',
                color: '#dc3545',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              Clear Completed ({completedTodos.length})
            </button>
          </form>
        </div>
      )}

      {/* Server Info */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h3>Server-Side Rendering Info</h3>
        <p><strong>Rendered at:</strong> {new Date().toISOString()}</p>
        <p><strong>Total Todos:</strong> {todos.length}</p>
        <p><strong>MCP Attributes:</strong> Present in server-rendered HTML</p>
      </div>
    </div>
  );
}