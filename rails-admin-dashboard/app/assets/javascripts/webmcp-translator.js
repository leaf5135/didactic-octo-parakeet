document.addEventListener('DOMContentLoaded', () => {
  if (!window.mcp) {
    console.log('WebMCP not available, skipping tool registration');
    return;
  }

  const z = Zod;

  document.querySelectorAll('[tool-name]').forEach(element => {
    const toolName = element.getAttribute('tool-name');
    const toolDescription = element.getAttribute('tool-description') || '';

    if (element.tagName === 'FORM') {
      registerFormTool(element, toolName, toolDescription, z);
    } else if (element.tagName === 'A') {
      registerLinkTool(element, toolName, toolDescription, z);
    }
  });
});

function registerFormTool(form, toolName, toolDescription, z) {
  const inputs = form.querySelectorAll('input:not([type="hidden"]), textarea, select');
  const schema = {};

  inputs.forEach(input => {
    const name = input.name;
    if (!name) return;

    let fieldSchema = z.string();
    if (!input.required) {
      fieldSchema = fieldSchema.optional();
    }
    const paramDesc = input.getAttribute('tool-param-description');
    if (paramDesc) {
      fieldSchema = fieldSchema.describe(paramDesc);
    }

    schema[name] = fieldSchema;
  });

  window.mcp.registerTool(
    toolName,
    {
      title: toolName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: toolDescription,
      inputSchema: schema
    },
    async (params) => {
      try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.name = 'tool-frame-' + Date.now();
        document.body.appendChild(iframe);

        const tempForm = form.cloneNode(true);
        tempForm.target = iframe.name;
        const actionUrl = new URL(form.action, window.location.href);
        actionUrl.searchParams.set('agent', 'true');
        tempForm.action = actionUrl.toString();

        Object.keys(params).forEach(key => {
          const input = tempForm.querySelector(`[name="${key}"]`);
          if (input) input.value = params[key];
        });

        document.body.appendChild(tempForm);
        tempForm.submit();

        return new Promise((resolve) => {
          iframe.onload = () => {
            try {
              const data = iframe.contentDocument.getElementById('agent-response');
              const json = data ? JSON.parse(data.textContent) : { success: true };

              window.location.reload();

              resolve({
                content: [{
                  type: 'text',
                  text: JSON.stringify(json, null, 2)
                }]
              });
            } finally {
              document.body.removeChild(iframe);
              document.body.removeChild(tempForm);
            }
          };
        });
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
  );
}

function registerLinkTool(link, toolName, toolDescription, z) {
  window.mcp.registerTool(
    toolName,
    {
      title: toolName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: toolDescription,
      inputSchema: {}
    },
    async () => {
      try {
        const url = new URL(link.href, window.location.href);
        url.searchParams.set('agent', 'true');

        const res = await fetch(url.toString(), {
          headers: { 'Accept': 'text/html' },
          credentials: 'same-origin'
        });

        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const data = doc.getElementById('agent-response');
        const json = data ? JSON.parse(data.textContent) : {};

        window.location.reload();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(json, null, 2)
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
  );
}