export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// In-memory storage (in production, this would be a database)
let todos: Todo[] = [
  { id: 1, text: 'Learn about WebMCP', completed: false },
  { id: 2, text: 'Build a React app', completed: true },
  { id: 3, text: 'Test SSR with MCP attributes', completed: false }
];

export function getTodos(): Todo[] {
  return [...todos]; // Return a copy to prevent direct mutation
}

export function addTodo(text: string): Todo {
  const newTodo: Todo = {
    id: Math.max(...todos.map(t => t.id), 0) + 1,
    text: text.trim(),
    completed: false
  };
  todos.push(newTodo);
  return newTodo;
}

export function toggleTodo(id: number): Todo | null {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    return todo;
  }
  return null;
}

export function deleteTodo(id: number): boolean {
  const index = todos.findIndex(t => t.id === id);
  if (index !== -1) {
    todos.splice(index, 1);
    return true;
  }
  return false;
}

export function clearCompleted(): number {
  const completedCount = todos.filter(t => t.completed).length;
  todos = todos.filter(t => !t.completed);
  return completedCount;
}