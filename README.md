# WebMCP Declarative Tools

## Overview

This project implements declarative MCP (Model Context Protocol) tool registration for web applications through HTML attributes. It includes two demonstration applications and a browser extension that converts annotated HTML elements into MCP tools without requiring API development.

## Repository Structure

```
/
├── extension/           # Browser extension with universal MCP registry script
├── convex-todo/  # React SPA using Next.js 14 and Convex
└── rails-admin-dashboard/   # Server-rendered Rails 7 application
```

## Components

### Next.js + Convex Demo

A React-based todo application demonstrating:
- Client-side form handling with React event handlers
- Real-time updates via Convex
- Tool registration without page reloads
- State preservation during tool execution

### Rails + SQLite Demo

A traditional server-rendered application showing:
- Form-based tool registration
- Content negotiation for dual responses (HTML for users, JSON for agents)
- RESTful routing with MCP annotations
- Server-side validation and processing

## Installation

### Next.js Application

```bash
cd convex-todo
npm install
npm run dev
# Access at http://localhost:3000
```

### Rails Application

```bash
cd rails-admin-dashboard
bundle install
rails db:create db:migrate
rails server
# Access at http://localhost:3001
```

## HTML Attribute Specification

### Core Attributes

| Attribute | Element Types | Description |
|-----------|--------------|-------------|
| `tool-name` | form, a, button | Unique tool identifier (alphanumeric, underscore, dash, dot) |
| `tool-description` | form, a, button | Human-readable tool description |

### Parameter Attributes

| Attribute | Description |
|-----------|-------------|
| `tool-param-description` | Parameter description |
| `tool-param-type` | Explicit type: `string`, `number`, `boolean` |
| `tool-param-format` | Format validation: `email`, `url`, `date`, `uuid` |
| `tool-param-min` | Minimum value (numbers) or length (strings) |
| `tool-param-max` | Maximum value (numbers) or length (strings) |
| `tool-param-pattern` | Regular expression pattern |
| `tool-param-enum` | Comma-separated allowed values |

### Type Inference

When `tool-param-type` is omitted:
- `<input type="checkbox">` → boolean
- `<input type="number">` → number
- `<input type="email">` → string with email format
- `<input type="url">` → string with URL format
- `<select>` → string with enum from options
- Default → string

## Implementation Examples

### React Form

```jsx
<form
  tool-name="create_todo"
  tool-description="Create a new todo item"
  onSubmit={handleSubmit}>
  <input
    name="text"
    required
    tool-param-description="Todo item text"
    tool-param-min="1"
    tool-param-max="200" />
  <button type="submit">Add</button>
</form>
```

### Rails Form

```erb
<%= form_with model: @todo,
              html: {
                "tool-name": "update_todo",
                "tool-description": "Update existing todo"
              } do |form| %>
  <%= form.text_field :description,
                      required: true,
                      "tool-param-description": "Updated text" %>
  <%= form.submit %>
<% end %>
```

### Navigation Link

```html
<a href="/todos"
   tool-name="list_todos"
   tool-description="Retrieve all todos">
  View All
</a>
```

## Technical Implementation

### Platform Detection

The script determines the execution environment through:
1. React DevTools hook presence
2. React global object detection
3. React fiber node inspection in DOM elements
4. Fallback heuristics (root element, bundled scripts)

### Execution Strategies

**React Applications:**
- Intercepts form `onSubmit` handlers
- Calls React event handlers with synthetic events
- Updates form inputs via `onChange` to maintain state
- Prevents page navigation

**Traditional Applications:**
- Creates hidden iframes for form submission
- Adds `agent=true` query parameter for content negotiation
- Parses embedded JSON responses
- Handles redirects after successful operations

### Change Detection

**React Applications:**
- Hooks into React DevTools `onCommitFiberRoot`
- Monitors React render cycles
- Tracks element reference changes

**Traditional Applications:**
- MutationObserver on document body
- Monitors for added/removed nodes
- Periodic cleanup of orphaned tools

## Backend Response Handling

### Rails Example

```ruby
def create
  @todo = Todo.create(todo_params)

  if request.headers['X-MCP-Tool'] || params[:agent]
    render html: <<~HTML
      <div id='agent-response' style='display:none'>
        #{@todo.to_json}
      </div>
    HTML
  else
    redirect_to @todo
  end
end
```

### Node.js Example

```javascript
app.post('/todos', (req, res) => {
  const todo = createTodo(req.body);

  if (req.query.agent === 'true') {
    res.send(`
      <div id='agent-response' style='display:none'>
        ${JSON.stringify(todo)}
      </div>
    `);
  } else {
    res.redirect(`/todos/${todo.id}`);
  }
});
```

## Project Origins

This implementation is based on discussions in the [W3C WebMCP proposal](https://github.com/w3c/webmcp/issues) about creating declarative alternatives to JavaScript-only MCP tool registration. The approach prioritizes:

- Minimal JavaScript requirements
- Reuse of existing HTML patterns
- Progressive enhancement
- Backward compatibility
- Framework independence

## Technical Specifications

- **Script size**: ~15KB minified
- **Browser support**: Chrome 90+, Firefox 88+, Safari 14+
- **Framework compatibility**: React 16+, Rails 5+, Express, Django
- **Response time**: <100ms for tool registration, <500ms for execution

## License

MIT