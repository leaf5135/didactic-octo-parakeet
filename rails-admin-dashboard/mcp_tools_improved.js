console.log("DOMContentLoaded", window.mcp)
import("https://cdn.jsdelivr.net/npm/zod@3.23.8/+esm").then((z) => {
  document.querySelectorAll("[tool-name]").forEach((element) => {
    const rawToolName = element.getAttribute("tool-name")
    // Sanitize tool name to match pattern: ^[a-zA-Z0-9_.-]{1,64}$
    // Replace any invalid characters with underscores
    const toolName = rawToolName.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 64)
    const toolDescription = element.getAttribute("tool-description") || ""

    if (element.tagName === "FORM") {
      registerFormTool(element, toolName, toolDescription, z)
    } else if (element.tagName === "A") {
      registerLinkTool(element, toolName, toolDescription, z)
    }
  })

  function registerFormTool(form, toolName, toolDescription, z) {
    const inputs = form.querySelectorAll('input:not([type="hidden"]), textarea, select')
    const schema = {}

    inputs.forEach((input) => {
      const rawName = input.name
      if (!rawName) return

      // Sanitize field names as well to ensure they match the pattern
      const name = rawName.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 64)

      let fieldSchema
      let paramDesc = input.getAttribute("tool-param-description") || ""

      // Use appropriate schema types based on input type
      if (input.type === 'checkbox') {
        fieldSchema = z.boolean()
        paramDesc = paramDesc || "Check/uncheck option"
      } else if (input.type === 'number') {
        fieldSchema = z.number()
        paramDesc = paramDesc || "Numeric value"
      } else {
        // Default to string for text inputs
        fieldSchema = z.string()

        // Add type hints for specific string inputs
        if (input.type === 'email') {
          paramDesc += paramDesc ? ' (valid email format)' : 'Email address'
        } else if (input.type === 'password') {
          paramDesc = paramDesc || 'Password'
        } else if (input.tagName === 'SELECT') {
          const options = Array.from(input.options).map(opt => opt.value)
          if (options.length > 0 && options.length <= 10) {
            paramDesc += ` (options: ${options.join(', ')})`
          }
        }
      }

      // Add required/optional info
      if (!input.required) {
        fieldSchema = fieldSchema.optional()
        paramDesc += ' [optional]'
      } else {
        paramDesc += ' [required]'
      }

      // Add the description to the schema
      if (paramDesc) {
        fieldSchema = fieldSchema.describe(paramDesc.trim())
      }

      schema[name] = fieldSchema
    })

    window.mcp.registerTool(
      toolName,
      {
        title: toolName.replace(/[_.-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        description: toolDescription,
        inputSchema: schema
      },
      async (params) => {
        try {
          const iframe = document.createElement("iframe")
          iframe.style.display = "none"
          iframe.name = "tool-frame-" + Date.now()
          document.body.appendChild(iframe)

          const tempForm = form.cloneNode(true)
          tempForm.target = iframe.name
          const actionUrl = new URL(form.action, window.location.href)
          actionUrl.searchParams.set("agent", "true")
          tempForm.action = actionUrl.toString()

          // Map sanitized param names back to original field names and convert types
          const inputs = form.querySelectorAll('input:not([type="hidden"]), textarea, select')
          inputs.forEach((originalInput) => {
            const originalName = originalInput.name
            if (!originalName) return

            const sanitizedName = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 64)
            if (params[sanitizedName] !== undefined) {
              const input = tempForm.querySelector(`[name="${originalName}"]`)
              if (input) {
                // Convert boolean to "1" or "0" for checkboxes
                if (input.type === 'checkbox') {
                  input.checked = params[sanitizedName]
                  // For Rails, we need to ensure the value is set correctly
                  if (params[sanitizedName]) {
                    input.value = "1"
                    input.checked = true
                  } else {
                    // Don't submit unchecked checkboxes
                    input.checked = false
                  }
                } else if (input.type === 'number') {
                  // Convert number to string for form submission
                  input.value = String(params[sanitizedName])
                } else {
                  // String values pass through as-is
                  input.value = params[sanitizedName]
                }
              }
            }
          })

          document.body.appendChild(tempForm)
          tempForm.submit()

          return new Promise((resolve) => {
            iframe.onload = () => {
              try {
                const data = iframe.contentDocument.getElementById("agent-response")
                const json = data ? JSON.parse(data.textContent) : { success: true }

                // Resolve the promise first so the tool completes
                resolve({
                  content: [
                    {
                      type: "text",
                      text: JSON.stringify(json, null, 2)
                    }
                  ]
                })

                // Then handle the redirect after a short delay
                setTimeout(() => {
                  if (json.redirect_url) {
                    window.location.href = json.redirect_url
                  } else {
                    window.location.reload()
                  }
                }, 100)
              } finally {
                document.body.removeChild(iframe)
                document.body.removeChild(tempForm)
              }
            }
          })
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error.message}`
              }
            ],
            isError: true
          }
        }
      }
    )
  }

  function registerLinkTool(link, toolName, toolDescription, z) {
    window.mcp.registerTool(
      toolName,
      {
        title: toolName.replace(/[_.-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        description: toolDescription,
        inputSchema: {}
      },
      async () => {
        try {
          const url = new URL(link.href, window.location.href)
          url.searchParams.set("agent", "true")

          const res = await fetch(url.toString(), {
            headers: { Accept: "text/html" },
            credentials: "same-origin"
          })

          const html = await res.text()
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, "text/html")
          const data = doc.getElementById("agent-response")
          const json = data ? JSON.parse(data.textContent) : {}

          // Resolve first
          const result = {
            content: [
              {
                type: "text",
                text: JSON.stringify(json, null, 2)
              }
            ]
          }

          // Then redirect after a delay
          setTimeout(() => {
            if (json.redirect_url) {
              window.location.href = json.redirect_url
            } else {
              window.location.reload()
            }
          }, 100)

          return result
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error.message}`
              }
            ],
            isError: true
          }
        }
      }
    )
  }
})