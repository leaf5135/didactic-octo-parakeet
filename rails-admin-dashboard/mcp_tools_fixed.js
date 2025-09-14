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

      let fieldSchema = z.string()
      if (!input.required) {
        fieldSchema = fieldSchema.optional()
      }
      const paramDesc = input.getAttribute("tool-param-description")
      if (paramDesc) {
        fieldSchema = fieldSchema.describe(paramDesc)
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

          // Map sanitized param names back to original field names
          const inputs = form.querySelectorAll('input:not([type="hidden"]), textarea, select')
          inputs.forEach((originalInput) => {
            const originalName = originalInput.name
            if (!originalName) return

            const sanitizedName = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 64)
            if (params[sanitizedName] !== undefined) {
              const input = tempForm.querySelector(`[name="${originalName}"]`)
              if (input) input.value = params[sanitizedName]
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

          // Check if there's a redirect URL in the response
          if (json.redirect_url) {
            window.location.href = json.redirect_url
          } else {
            window.location.reload()
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(json, null, 2)
              }
            ]
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
          }
        }
      }
    )
  }
})