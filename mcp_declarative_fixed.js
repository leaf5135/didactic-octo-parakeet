/**
 * Declarative MCP Tool Registration - Fixed for Navigation
 * Automatically registers tools from HTML attributes
 */

console.log("Initializing Declarative MCP Registry", window.mcp);

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

    // Register all buttons with tool-name (for logout button)
    document.querySelectorAll('button[tool-name]').forEach(button => {
      this.registerButtonTool(button);
    });
  }

  registerButtonTool(button) {
    const rawToolName = button.getAttribute('tool-name');
    const toolName = rawToolName.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 64);
    const toolDescription = button.getAttribute('tool-description') || '';

    console.log(`Registering button tool: ${toolName}`);

    window.mcp.registerTool(
      toolName,
      {
        title: toolName.replace(/[_.-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        description: toolDescription,
        inputSchema: {}
      },
      async () => {
        return this.executeButtonTool(button);
      }
    );
  }

  async executeButtonTool(button) {
    try {
      // Find the parent form if this is a submit button
      const form = button.closest('form');
      if (form) {
        // This is a form submission button (like logout)
        const actionUrl = new URL(form.action, window.location.href);
        actionUrl.searchParams.set("agent", "true");

        const formData = new FormData(form);
        const method = form.method?.toUpperCase() || 'POST';

        const res = await fetch(actionUrl.toString(), {
          method: method,
          body: method === 'GET' ? undefined : formData,
          headers: {
            'X-MCP-Tool': 'true'
          },
          credentials: "same-origin"
        });

        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const data = doc.getElementById("agent-response");
        const json = data ? JSON.parse(data.textContent) : { success: true };

        // Handle redirect
        if (json.redirect_url) {
          window.location.href = json.redirect_url;
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify(json, null, 2)
          }]
        };
      } else {
        // Regular button click
        button.click();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, action: "button clicked" }, null, 2)
          }]
        };
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    }
  }

  registerFormTool(form) {
    const rawToolName = form.getAttribute('tool-name');
    const toolName = rawToolName.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 64);
    const toolDescription = form.getAttribute('tool-description') || '';

    // Build parameter schema from form inputs
    const schema = this.buildFormSchema(form);

    console.log(`Registering form tool: ${toolName}`, schema);

    window.mcp.registerTool(
      toolName,
      {
        title: toolName.replace(/[_.-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        description: toolDescription,
        inputSchema: schema
      },
      async (params) => {
        return this.executeFormTool(form, params);
      }
    );
  }

  buildFormSchema(form) {
    const schema = {};
    const inputs = form.querySelectorAll('input:not([type="hidden"]), textarea, select');

    inputs.forEach(input => {
      const rawName = input.name;
      if (!rawName) return;

      // Sanitize field name for MCP
      const name = rawName.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 64);

      // Build Zod schema for this input
      const fieldSchema = this.buildInputSchema(input);
      schema[name] = fieldSchema;
    });

    return schema;
  }

  buildInputSchema(input) {
    // Import Zod dynamically
    const z = window.z || window.Zod;
    if (!z) {
      console.error('Zod not loaded');
      return null;
    }

    // Determine type
    const explicitType = input.getAttribute('tool-param-type');
    const inferredType = this.inferTypeFromInput(input);
    const type = explicitType || inferredType;

    let fieldSchema;

    // Create base schema based on type
    switch(type) {
      case 'boolean':
        fieldSchema = z.boolean();
        break;
      case 'number':
        fieldSchema = z.number();
        break;
      default:
        fieldSchema = z.string();
    }

    // Add format validation
    const format = input.getAttribute('tool-param-format');
    if (format === 'email' && type === 'string') {
      fieldSchema = z.string().email();
    } else if (format === 'url' && type === 'string') {
      fieldSchema = z.string().url();
    }

    // Add min/max constraints
    const min = input.getAttribute('tool-param-min');
    const max = input.getAttribute('tool-param-max');

    if (min && type === 'string') {
      fieldSchema = fieldSchema.min(parseInt(min));
    } else if (min && type === 'number') {
      fieldSchema = fieldSchema.min(parseFloat(min));
    }

    if (max && type === 'string') {
      fieldSchema = fieldSchema.max(parseInt(max));
    } else if (max && type === 'number') {
      fieldSchema = fieldSchema.max(parseFloat(max));
    }

    // Add pattern validation
    const pattern = input.getAttribute('tool-param-pattern');
    if (pattern && type === 'string') {
      fieldSchema = fieldSchema.regex(new RegExp(pattern));
    }

    // Add enum validation
    const enumValues = input.getAttribute('tool-param-enum');
    if (enumValues) {
      const options = enumValues.split(',').map(v => v.trim());
      fieldSchema = z.enum(options);
    }

    // Handle required/optional
    const isRequired = input.hasAttribute('required') || input.required;
    if (!isRequired) {
      fieldSchema = fieldSchema.optional();
    }

    // Add description
    const description = input.getAttribute('tool-param-description');
    if (description) {
      // Build enhanced description with type info
      let enhancedDesc = description;

      if (type === 'boolean') {
        enhancedDesc += ' [boolean]';
      } else if (type === 'number') {
        enhancedDesc += ' [number]';
      }

      if (isRequired) {
        enhancedDesc += ' [required]';
      } else {
        enhancedDesc += ' [optional]';
      }

      fieldSchema = fieldSchema.describe(enhancedDesc);
    }

    return fieldSchema;
  }

  inferTypeFromInput(input) {
    if (input.type === 'checkbox') return 'boolean';
    if (input.type === 'number') return 'number';
    return 'string';
  }

  async executeFormTool(form, params) {
    try {
      // Create iframe for form submission
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.name = "tool-frame-" + Date.now();
      document.body.appendChild(iframe);

      // Clone form for submission
      const tempForm = form.cloneNode(true);
      tempForm.target = iframe.name;

      // Add agent parameter to URL
      const actionUrl = new URL(form.action, window.location.href);
      actionUrl.searchParams.set("agent", "true");
      tempForm.action = actionUrl.toString();

      // Map parameters to form inputs
      const inputs = form.querySelectorAll('input:not([type="hidden"]), textarea, select');
      inputs.forEach(originalInput => {
        const originalName = originalInput.name;
        if (!originalName) return;

        const sanitizedName = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 64);
        if (params[sanitizedName] !== undefined) {
          const input = tempForm.querySelector(`[name="${originalName}"]`);
          if (input) {
            // Handle different input types
            if (input.type === 'checkbox') {
              // Convert boolean to checkbox
              input.checked = params[sanitizedName];
              if (params[sanitizedName]) {
                input.value = "1";
              }
            } else if (input.type === 'number') {
              // Convert number to string
              input.value = String(params[sanitizedName]);
            } else {
              // String values pass through
              input.value = params[sanitizedName];
            }
          }
        }
      });

      // Submit form
      document.body.appendChild(tempForm);
      tempForm.submit();

      return new Promise((resolve) => {
        iframe.onload = () => {
          try {
            const data = iframe.contentDocument.getElementById("agent-response");
            const json = data ? JSON.parse(data.textContent) : { success: true };

            // Resolve promise first
            resolve({
              content: [
                {
                  type: "text",
                  text: JSON.stringify(json, null, 2)
                }
              ]
            });

            // Handle redirect after a short delay
            setTimeout(() => {
              if (json.redirect_url) {
                window.location.href = json.redirect_url;
              } else {
                window.location.reload();
              }
            }, 100);
          } finally {
            document.body.removeChild(iframe);
            document.body.removeChild(tempForm);
          }
        };
      });
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }

  registerLinkTool(link) {
    const rawToolName = link.getAttribute('tool-name');
    const toolName = rawToolName.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 64);
    const toolDescription = link.getAttribute('tool-description') || '';

    console.log(`Registering link tool: ${toolName}`);

    window.mcp.registerTool(
      toolName,
      {
        title: toolName.replace(/[_.-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        description: toolDescription,
        inputSchema: {}
      },
      async () => {
        return this.executeLinkTool(link);
      }
    );
  }

  async executeLinkTool(link) {
    try {
      const toolName = link.getAttribute('tool-name');

      // Check if this is a navigation link
      if (toolName && toolName.includes('navigate')) {
        // For navigation links, just navigate directly without agent parameter
        console.log(`Navigating to: ${link.href}`);

        // Navigate to the page
        window.location.href = link.href;

        // Return success message (this will be shown before navigation)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                action: "navigating",
                url: link.href
              }, null, 2)
            }
          ]
        };
      } else {
        // For action links (like delete), use the agent parameter
        const url = new URL(link.href, window.location.href);
        url.searchParams.set("agent", "true");

        const res = await fetch(url.toString(), {
          headers: {
            Accept: "text/html",
            'X-MCP-Tool': 'true'
          },
          credentials: "same-origin"
        });

        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const data = doc.getElementById("agent-response");
        const json = data ? JSON.parse(data.textContent) : {};

        // Handle redirect after getting response
        if (json.redirect_url) {
          setTimeout(() => {
            window.location.href = json.redirect_url;
          }, 100);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(json, null, 2)
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`
          }
        ],
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
            } else if (node.matches?.('button[tool-name]')) {
              this.registerButtonTool(node);
            }

            // Check children
            node.querySelectorAll?.('form[tool-name]').forEach(form => {
              this.registerFormTool(form);
            });
            node.querySelectorAll?.('a[tool-name]').forEach(link => {
              this.registerLinkTool(link);
            });
            node.querySelectorAll?.('button[tool-name]').forEach(button => {
              this.registerButtonTool(button);
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

// Initialize with Zod
import("https://cdn.jsdelivr.net/npm/zod@3.23.8/+esm").then((zod) => {
  window.z = zod.z;
  window.Zod = zod.z;

  // Initialize registry
  if (window.mcp) {
    new DeclarativeMCPRegistry();
  } else {
    console.log('Waiting for MCP to be ready...');
    // Try again in a moment
    setTimeout(() => {
      if (window.mcp) {
        new DeclarativeMCPRegistry();
      }
    }, 1000);
  }
});