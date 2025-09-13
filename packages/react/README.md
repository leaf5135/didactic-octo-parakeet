# react-mcp-attributes

Type-safe React utilities for adding WebMCP tool attributes to existing forms and links.

## Installation

```bash
npm install react-mcp-attributes
```

## Usage

Import the `mcp` utility and spread the returned attributes onto your existing React components:

```tsx
import { mcp } from 'react-mcp-attributes';

function ContactForm() {
  return (
    <form 
      action="/api/contact"
      {...mcp.tool('send-message', 'Send a contact message')}
    >
      <input 
        name="email"
        type="email"
        required
        {...mcp.param('Your email address', { 
          type: 'string', 
          required: true 
        })}
      />
      
      <textarea 
        name="message"
        required
        {...mcp.param('Your message', { 
          type: 'string', 
          required: true,
          min: 10 
        })}
      />
      
      <button type="submit">Send</button>
    </form>
  );
}

function QuickAction() {
  return (
    <a 
      href="/api/logout"
      {...mcp.tool('logout', 'Log out the current user')}
    >
      Logout
    </a>
  );
}
```

## API

### `mcp.tool(name, description?)`

Creates attributes for MCP tool registration on forms and links.

- `name` (string): The tool name used as the MCP tool identifier
- `description` (string, optional): Description of what the tool does

Returns an object with `tool-name` and optionally `tool-description` attributes.

### `mcp.param(description, schema?)`

Creates attributes for MCP parameter descriptions on form inputs.

- `description` (string): Description of what this parameter represents
- `schema` (object, optional): Schema validation (reserved for future use)

Returns an object with `tool-param-description` attribute.

## How it Works

This package generates the HTML attributes that the WebMCP extension looks for:

- Forms and links with `tool-name` and `tool-description` become MCP tools
- Inputs with `tool-param-description` become tool parameters
- The WebMCP extension automatically generates MCP servers from these attributes

## TypeScript Support

Full TypeScript support with proper typing for all attributes and return values.