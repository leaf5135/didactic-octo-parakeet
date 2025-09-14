# Declarative MCP Tool Registration Proposal

## Overview
A declarative HTML-first approach to MCP tool registration that requires minimal JavaScript and works with existing web patterns.

## HTML Attribute Standard

### Core Attributes (Required)

#### For Forms and Links
- `tool-name` - Unique identifier for the tool
- `tool-description` - Human-readable description of what the tool does

### Parameter Attributes (For Form Inputs)

#### Essential
- `tool-param-description` - Description of the parameter

#### Type Declaration (Optional but Recommended)
- `tool-param-type` - Explicit type: `string`, `number`, `boolean`, `object`, `array`
- If omitted, type is inferred from HTML:
  - `<input type="checkbox">` → boolean
  - `<input type="number">` → number
  - `<input type="email">` → string (with email format validation)
  - `<input type="url">` → string (with URL format validation)
  - `<input type="date">` → string (with date format validation)
  - `<input type="file">` → string (base64 encoded)
  - `<select>` → string (with enum from options if ≤10)
  - `<textarea>` → string
  - All others → string

#### Validation (Optional)
- `tool-param-format` - Format constraint: `email`, `url`, `date`, `uuid`, etc.
- `tool-param-min` - Minimum value (numbers) or length (strings)
- `tool-param-max` - Maximum value (numbers) or length (strings)
- `tool-param-pattern` - Regex pattern for validation
- `tool-param-enum` - Comma-separated list of allowed values

## HTML Examples

### Simple Form
```html
<form action="/todos" method="post"
      tool-name="add-todo"
      tool-description="Add a new todo item. Returns the created todo.">

  <input type="text"
         name="description"
         required
         tool-param-description="The todo item text"
         tool-param-min="1"
         tool-param-max="200">

  <select name="priority"
          tool-param-description="Priority level"
          tool-param-enum="low,medium,high">
    <option value="low">Low</option>
    <option value="medium">Medium</option>
    <option value="high">High</option>
  </select>

  <input type="checkbox"
         name="urgent"
         tool-param-description="Mark as urgent"
         tool-param-type="boolean">

  <button type="submit">Add Todo</button>
</form>
```

### Navigation Link
```html
<a href="/todos"
   tool-name="list-todos"
   tool-description="Get list of all todos">
  View All Todos
</a>
```

### Complex Form with Validation
```html
<form action="/users" method="post"
      tool-name="create-user"
      tool-description="Create a new user account. Redirects to user profile on success.">

  <input type="email"
         name="email"
         required
         tool-param-description="User's email address">
         <!-- Format automatically inferred from type="email" -->

  <input type="text"
         name="username"
         required
         tool-param-description="Unique username (alphanumeric and underscore only)"
         tool-param-pattern="^[a-zA-Z0-9_]{3,20}$"
         tool-param-min="3"
         tool-param-max="20">

  <input type="number"
         name="age"
         tool-param-description="User's age"
         tool-param-min="13"
         tool-param-max="120">
         <!-- Type automatically inferred from type="number" -->

  <input type="checkbox"
         name="newsletter"
         tool-param-description="Subscribe to newsletter"
         tool-param-type="boolean">
         <!-- Explicit type for clarity, though would be inferred -->

  <textarea name="bio"
            tool-param-description="User biography (optional)"
            tool-param-max="500"></textarea>

  <button type="submit">Create Account</button>
</form>
```

## JavaScript Implementation

### Core Registration Script
```javascript
// Minimal script that translates declarative HTML to MCP tools
class DeclarativeMCPRegistry {
  constructor() {
    this.registerDeclarativeTools();
    this.observeNewElements();
  }

  registerDeclarativeTools() {
    // Register all forms with tool-name
    document.querySelectorAll('form[tool-name]').forEach(form => {
      this.registerFormTool(form);
    });

    // Register all links with tool-name
    document.querySelectorAll('a[tool-name]').forEach(link => {
      this.registerLinkTool(link);
    });
  }

  registerFormTool(form) {
    const toolName = form.getAttribute('tool-name');
    const toolDescription = form.getAttribute('tool-description') || '';

    // Build parameter schema from form inputs
    const schema = this.buildFormSchema(form);

    window.mcp.registerTool(toolName, {
      description: toolDescription,
      parameters: {
        type: 'object',
        properties: schema.properties,
        required: schema.required
      }
    }, async (params) => {
      return this.executeFormTool(form, params);
    });
  }

  buildFormSchema(form) {
    const properties = {};
    const required = [];

    const inputs = form.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
      if (!input.name) return;

      const schema = this.buildInputSchema(input);
      properties[input.name] = schema;

      if (input.required || input.hasAttribute('required')) {
        required.push(input.name);
      }
    });

    return { properties, required };
  }

  buildInputSchema(input) {
    const schema = {};

    // Determine type
    const explicitType = input.getAttribute('tool-param-type');
    const inferredType = this.inferTypeFromInput(input);
    schema.type = explicitType || inferredType;

    // Add description
    const description = input.getAttribute('tool-param-description');
    if (description) {
      schema.description = description;
    }

    // Add format
    const format = input.getAttribute('tool-param-format') ||
                   this.inferFormatFromInput(input);
    if (format) {
      schema.format = format;
    }

    // Add validation constraints
    const min = input.getAttribute('tool-param-min') ||
                input.getAttribute('min') ||
                input.getAttribute('minlength');
    if (min) {
      schema[schema.type === 'string' ? 'minLength' : 'minimum'] =
        schema.type === 'number' ? parseFloat(min) : parseInt(min);
    }

    const max = input.getAttribute('tool-param-max') ||
                input.getAttribute('max') ||
                input.getAttribute('maxlength');
    if (max) {
      schema[schema.type === 'string' ? 'maxLength' : 'maximum'] =
        schema.type === 'number' ? parseFloat(max) : parseInt(max);
    }

    // Add pattern
    const pattern = input.getAttribute('tool-param-pattern') ||
                    input.getAttribute('pattern');
    if (pattern) {
      schema.pattern = pattern;
    }

    // Add enum
    const enumValues = input.getAttribute('tool-param-enum');
    if (enumValues) {
      schema.enum = enumValues.split(',').map(v => v.trim());
    } else if (input.tagName === 'SELECT') {
      // Auto-extract from select options
      const options = Array.from(input.options)
        .map(opt => opt.value)
        .filter(v => v);
      if (options.length > 0) {
        schema.enum = options;
      }
    }

    return schema;
  }

  inferTypeFromInput(input) {
    if (input.type === 'checkbox') return 'boolean';
    if (input.type === 'number') return 'number';
    if (input.type === 'file') return 'string'; // base64 encoded
    return 'string';
  }

  inferFormatFromInput(input) {
    const typeFormats = {
      'email': 'email',
      'url': 'url',
      'date': 'date',
      'datetime-local': 'date-time',
      'time': 'time',
      'tel': 'phone'
    };
    return typeFormats[input.type];
  }

  async executeFormTool(form, params) {
    try {
      const formData = new FormData();

      // Map parameters to form data
      Object.entries(params).forEach(([key, value]) => {
        const input = form.querySelector(`[name="${key}"]`);

        if (input && input.type === 'checkbox') {
          // Convert boolean to checkbox value
          if (value) {
            formData.append(key, input.value || 'on');
          }
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      // Submit with Accept header for JSON response
      const response = await fetch(form.action, {
        method: form.method || 'POST',
        headers: {
          'Accept': 'application/json',
          'X-MCP-Tool': 'true' // Identify as tool request
        },
        body: formData,
        credentials: 'same-origin'
      });

      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    }
  }

  registerLinkTool(link) {
    const toolName = link.getAttribute('tool-name');
    const toolDescription = link.getAttribute('tool-description') || '';

    window.mcp.registerTool(toolName, {
      description: toolDescription,
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }, async () => {
      return this.executeLinkTool(link);
    });
  }

  async executeLinkTool(link) {
    try {
      const response = await fetch(link.href, {
        headers: {
          'Accept': 'application/json',
          'X-MCP-Tool': 'true'
        },
        credentials: 'same-origin'
      });

      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    }
  }

  observeNewElements() {
    // Watch for dynamically added forms/links
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.matches?.('form[tool-name]')) {
              this.registerFormTool(node);
            } else if (node.matches?.('a[tool-name]')) {
              this.registerLinkTool(node);
            }

            // Check children
            node.querySelectorAll?.('form[tool-name]').forEach(form => {
              this.registerFormTool(form);
            });
            node.querySelectorAll?.('a[tool-name]').forEach(link => {
              this.registerLinkTool(link);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize when MCP is ready
if (window.mcp) {
  new DeclarativeMCPRegistry();
} else {
  window.addEventListener('mcp-ready', () => {
    new DeclarativeMCPRegistry();
  });
}
```

## Backend Implementation Examples

### Rails
```ruby
class ApplicationController < ActionController::Base
  # Helper to detect tool requests
  def tool_request?
    params[:agent] == 'true' ||
    request.headers['X-MCP-Tool'] == 'true' ||
    request.headers['Accept']&.include?('application/json')
  end

  # Helper for dual responses
  def respond_for_tool(json_data, &block)
    if tool_request?
      # Embed JSON in HTML for iframe-based submission
      render html: "<div id='agent-response' style='display:none'>#{json_data.to_json}</div>".html_safe
    else
      yield if block_given?
    end
  end
end

class TodosController < ApplicationController
  def create
    @todo = Todo.new(todo_params)

    if @todo.save
      respond_for_tool({
        success: true,
        todo: @todo.as_json,
        message: "Todo created successfully"
      }) do
        redirect_to @todo, notice: 'Todo was successfully created.'
      end
    else
      respond_for_tool({
        success: false,
        errors: @todo.errors.full_messages
      }) do
        render :new, status: :unprocessable_entity
      end
    end
  end

  def index
    @todos = Todo.all

    respond_for_tool({
      todos: @todos.as_json,
      count: @todos.count
    }) do
      render :index
    end
  end
end
```

## Advantages of This Approach

1. **Progressive Enhancement** - Works without JavaScript, enhanced with it
2. **Standards-Based** - Uses existing HTML attributes and patterns
3. **Accessible** - No JavaScript knowledge required for basic tools
4. **SEO-Friendly** - Search engines can discover tools
5. **Backward Compatible** - Existing forms/links work as normal
6. **Type Safety** - Explicit typing with graceful inference
7. **Validation** - Leverages HTML5 validation attributes
8. **RESTful** - Works with standard REST patterns
9. **Framework Agnostic** - Works with any backend
10. **Extensible** - Easy to add new attributes as needed

## Migration Path

### Phase 1: Basic Attributes
- `tool-name`
- `tool-description`
- `tool-param-description`

### Phase 2: Type System
- `tool-param-type`
- Type inference from HTML

### Phase 3: Validation
- `tool-param-format`
- `tool-param-min/max`
- `tool-param-pattern`
- `tool-param-enum`

### Phase 4: Advanced Features
- `tool-param-default`
- `tool-param-examples`
- `tool-response-schema`
- `tool-auth-required`

### Express.js / Node.js
```javascript
app.post('/todos', (req, res) => {
  const isToolRequest = req.query.agent === 'true' ||
                       req.get('X-MCP-Tool') === 'true';

  const todo = createTodo(req.body);

  if (isToolRequest) {
    // Return embedded JSON for tools
    res.send(`
      <div id='agent-response' style='display:none'>
        ${JSON.stringify({
          success: true,
          todo: todo,
          redirect_url: `/todos/${todo.id}`
        })}
      </div>
    `);
  } else {
    // Normal redirect for users
    res.redirect(`/todos/${todo.id}`);
  }
});
```

### Django / Python
```python
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect

def create_todo(request):
    is_tool_request = (request.GET.get('agent') == 'true' or
                      request.headers.get('X-MCP-Tool') == 'true')

    todo = Todo.objects.create(
        description=request.POST['description']
    )

    if is_tool_request:
        # Return embedded JSON for tools
        response_data = {
            'success': True,
            'todo': {'id': todo.id, 'description': todo.description},
            'redirect_url': f'/todos/{todo.id}'
        }
        html = f"<div id='agent-response' style='display:none'>{json.dumps(response_data)}</div>"
        return HttpResponse(html)
    else:
        # Normal redirect for users
        return redirect('todo_detail', pk=todo.id)
```

## Key Learnings from Implementation

1. **Type inference works well** - Checkboxes → boolean, number inputs → number
2. **Explicit types help agents** - `tool-param-type="boolean"` prevents confusion
3. **Iframe submission handles redirects** - Better than pure AJAX for form compatibility
4. **Embedded JSON in HTML** - Works reliably across frameworks
5. **Sanitization is critical** - Tool names must match `^[a-zA-Z0-9_.-]{1,64}$`

## Summary

This declarative approach:
- Requires minimal JavaScript (~400 lines with full validation)
- Works with existing HTML patterns
- Provides progressive enhancement
- Maintains backward compatibility
- Enables broad ecosystem participation
- Sets foundation for future web standards
- **Proven in production** with Rails + MCP integration