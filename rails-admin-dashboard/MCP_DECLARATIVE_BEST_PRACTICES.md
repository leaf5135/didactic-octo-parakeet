# MCP Declarative Tool Registration Best Practices

## Overview
This guide provides best practices for implementing declarative MCP tool registration in Rails applications using HTML attributes. This approach requires minimal JavaScript and enables agents to interact with your application through standard HTML forms and links.

## Core Philosophy
- **HTML-first**: Tools are defined using HTML attributes
- **Progressive enhancement**: Works without complex JavaScript
- **Type safety**: Explicit typing with automatic inference
- **Standards-based**: Leverages HTML5 validation patterns

## Implementation Components

### 1. JavaScript Registration Script
Use `mcp_declarative.js` which:
- Auto-discovers elements with `tool-name` attribute
- Builds schemas from HTML attributes
- Handles type conversion automatically
- Watches for dynamically added elements

### 2. HTML Attributes Reference

## Essential Attributes

### Form/Link Attributes
```erb
tool-name="create-user"           # Required: Unique tool identifier
tool-description="Create a new user account. Redirects to user profile on success."
```

### Input Field Attributes

#### Basic Description
```erb
tool-param-description="User's email address"  # Required: Describes the parameter
```

#### Type Declaration
```erb
tool-param-type="string"   # Explicit type: string, number, boolean, object, array
                           # If omitted, inferred from HTML input type
```

#### Validation Attributes
```erb
tool-param-format="email"         # Format validation: email, url, date, uuid
tool-param-min="1"                # Minimum value (number) or length (string)
tool-param-max="100"              # Maximum value (number) or length (string)
tool-param-pattern="^[a-zA-Z]+$"  # Regex pattern for validation
tool-param-enum="low,medium,high" # Comma-separated allowed values
```

## Type Inference Rules

If `tool-param-type` is not specified, types are inferred:

| HTML Input Type | Inferred Type | Notes |
|----------------|---------------|-------|
| `type="checkbox"` | `boolean` | Automatically converts to Rails "1"/"0" format |
| `type="number"` | `number` | Validates as numeric |
| `type="email"` | `string` | Adds email format validation |
| `type="url"` | `string` | Adds URL format validation |
| `type="date"` | `string` | Adds date format validation |
| `<select>` | `string` | Auto-extracts enum from options |
| `<textarea>` | `string` | Default string type |
| All others | `string` | Default fallback |

## Complete Examples

### User Registration Form
```erb
<%= form_with(model: user, class: "space-y-6",
    html: {
      "tool-name" => user.new_record? ? "create-user" : "update-user-#{user.id}",
      "tool-description" => user.new_record? ?
        "Create a new user account. Redirects to user profile page on success." :
        "Update user details. Redirects to updated user profile."
    }) do |form| %>

  <!-- Text field with validation -->
  <%= form.text_field :first_name,
      required: true,
      "tool-param-description" => "User's first name",
      "tool-param-type" => "string",
      "tool-param-min" => "1",
      "tool-param-max" => "50" %>

  <!-- Email field - type inferred, format added -->
  <%= form.email_field :email,
      required: true,
      "tool-param-description" => "User's email address",
      "tool-param-format" => "email" %>

  <!-- Password with minimum length -->
  <%= form.password_field :password,
      required: true,
      "tool-param-description" => "User password (minimum 8 characters)",
      "tool-param-type" => "string",
      "tool-param-min" => "8" %>

  <!-- Checkbox - type explicitly set to boolean -->
  <%= form.check_box :active,
      "tool-param-description" => "Account status - active users can sign in",
      "tool-param-type" => "boolean" %>

  <!-- Select with auto-extracted enum -->
  <%= form.select :role,
      options_for_select(['admin', 'editor', 'viewer']),
      { prompt: 'Select role' },
      "tool-param-description" => "User role in the system" %>
      <!-- Enum automatically extracted from options -->

  <%= form.submit %>
<% end %>
```

### Navigation Links
```erb
<!-- Simple navigation -->
<%= link_to "View All Users", users_path,
    "tool-name" => "list-users",
    "tool-description" => "Navigate to users list. Provides create, edit, and delete user tools." %>

<!-- Action link -->
<%= link_to "Delete", user_path(@user),
    method: :delete,
    "tool-name" => "delete-user-#{@user.id}",
    "tool-description" => "Delete this user permanently. Redirects to users list." %>
```

### Complex Validation Example
```erb
<!-- Username with pattern validation -->
<%= form.text_field :username,
    required: true,
    "tool-param-description" => "Unique username (alphanumeric and underscore only)",
    "tool-param-pattern" => "^[a-zA-Z0-9_]{3,20}$",
    "tool-param-min" => "3",
    "tool-param-max" => "20" %>

<!-- Age with number validation -->
<%= form.number_field :age,
    "tool-param-description" => "User's age",
    "tool-param-type" => "number",
    "tool-param-min" => "13",
    "tool-param-max" => "120" %>

<!-- Priority with explicit enum -->
<%= form.select :priority,
    options_for_select(['low', 'medium', 'high', 'urgent']),
    {},
    "tool-param-description" => "Task priority level",
    "tool-param-enum" => "low,medium,high,urgent" %>

<!-- Optional field -->
<%= form.text_area :bio,
    "tool-param-description" => "User biography (optional)",
    "tool-param-max" => "500" %>
    <!-- No 'required' attribute makes it optional -->
```

## Controller Implementation

### Rails Controller Pattern
```ruby
class ApplicationController < ActionController::Base
  private

  def render_for_agent(json_response, &block)
    if params[:agent] == "true"
      # Return JSON for agent with redirect info
      render json: json_response,
             layout: false,
             formats: [:html] do |html|
        html << "<div id='agent-response' style='display:none'>"
        html << json_response.to_json
        html << "</div>"
      end
    else
      # Normal HTML response for users
      yield if block_given?
    end
  end
end

class UsersController < ApplicationController
  def create
    @user = User.new(user_params)

    if @user.save
      render_for_agent({
        success: true,
        message: "User created successfully",
        user: {
          id: @user.id,
          email: @user.email
        },
        redirect_url: user_url(@user)  # Critical for navigation
      }) do
        redirect_to @user, notice: "User was successfully created."
      end
    else
      render_for_agent({
        success: false,
        errors: @user.errors.full_messages,
        validation_errors: @user.errors.details
      }) do
        render :new, status: :unprocessable_entity
      end
    end
  end
end
```

## Best Practices Checklist

### ✅ DO's

1. **Always include redirect_url in responses**
   ```ruby
   render_for_agent({
     success: true,
     redirect_url: user_url(@user)
   })
   ```

2. **Use explicit types for non-strings**
   ```erb
   tool-param-type="boolean"  # For checkboxes
   tool-param-type="number"   # For numeric inputs
   ```

3. **Describe navigation outcomes**
   ```erb
   tool-description="Create user. Redirects to profile with edit/delete tools."
   ```

4. **Leverage HTML5 validation**
   ```erb
   required: true              # Makes field required
   min="1" max="100"          # HTML5 validation
   pattern="[A-Za-z]+"        # HTML5 pattern
   ```

5. **Use meaningful tool names**
   ```erb
   tool-name="create-user"           # Good
   tool-name="form1"                 # Bad
   ```

### ❌ DON'Ts

1. **Don't mix type info in descriptions**
   ```erb
   <!-- Bad -->
   tool-param-description="Boolean value for active status"

   <!-- Good -->
   tool-param-description="Account active status"
   tool-param-type="boolean"
   ```

2. **Don't use special characters in tool names**
   ```erb
   <!-- Bad - will be auto-sanitized -->
   tool-name="create-user-#{@user.id}"

   <!-- Good -->
   tool-name="create-user-123"
   ```

3. **Don't forget validation on critical fields**
   ```erb
   <!-- Always validate emails, passwords, etc. -->
   tool-param-format="email"
   tool-param-min="8"  # For passwords
   ```

4. **Don't assume type from field name**
   ```erb
   <!-- Always specify if not string -->
   <input name="count" tool-param-type="number">
   ```

## Migration Strategy

### From Old Approach to Declarative

**Old (JavaScript-heavy):**
```javascript
// Complex schema building in JS
fieldSchema = z.boolean().describe("Active status")
```

**New (Declarative):**
```erb
tool-param-description="Active status"
tool-param-type="boolean"
```

### Progressive Enhancement Steps

1. **Phase 1**: Add basic attributes to existing forms
   - `tool-name` and `tool-description` only

2. **Phase 2**: Add parameter descriptions
   - `tool-param-description` for all inputs

3. **Phase 3**: Add explicit types
   - `tool-param-type` for non-strings

4. **Phase 4**: Add validation
   - `tool-param-min/max`, `tool-param-format`, etc.

## Testing Your Implementation

### Quick Test Checklist
- [ ] Form has `tool-name` attribute
- [ ] Form has descriptive `tool-description`
- [ ] All inputs have `tool-param-description`
- [ ] Non-string inputs have `tool-param-type`
- [ ] Required fields marked with `required` attribute
- [ ] Controller returns `redirect_url` for agents
- [ ] Agent can successfully submit form
- [ ] Validation errors handled gracefully

### Debug Tips

1. **Check browser console** for registered tools:
   ```javascript
   console.log("Registered tools:", window.mcp.tools)
   ```

2. **Verify schema generation**:
   Look for: `Registering form tool: create-user {schema}`

3. **Test type conversion**:
   - Booleans should accept `true/false`
   - Numbers should accept numeric values
   - Strings with format should validate

## Common Patterns

### Conditional Fields
```erb
<% if user.new_record? %>
  <%= form.password_field :password,
      required: true,
      "tool-param-description" => "Initial password",
      "tool-param-min" => "8" %>
<% end %>
```

### Dynamic Tool Names
```erb
tool-name="<%= action_name %>-<%= controller_name %>-<%= @model.id || 'new' %>"
```

### File Uploads
```erb
<%= form.file_field :avatar,
    "tool-param-description" => "User avatar image",
    "tool-param-type" => "string",  # Base64 encoded
    "tool-param-format" => "data-url" %>
```

## Summary

The declarative approach provides:
- **Simplicity**: Just HTML attributes
- **Type safety**: Explicit types with validation
- **Standards compliance**: Works with HTML5
- **Progressive enhancement**: No JS required for basic function
- **Agent-friendly**: Clear schemas and descriptions
- **Maintainable**: Less JavaScript, more HTML

Follow these patterns and your Rails application will seamlessly integrate with MCP agents while maintaining clean, maintainable code.