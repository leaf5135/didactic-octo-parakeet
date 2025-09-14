# MCP Tool Registration Best Practices for Rails Applications

## Overview
This guide provides best practices for implementing MCP (Model Context Protocol) tool registration in Rails applications using HTML attributes and JavaScript. These patterns ensure agents can successfully interact with your application's forms and links.

## Core Implementation

### JavaScript Registration Script
The registration script (`mcp_tools_improved.js`) handles:
- Automatic tool name sanitization (replacing invalid characters)
- Type-appropriate Zod schema generation
- Boolean conversion for checkboxes
- Redirect handling after form submission
- Parameter mapping between sanitized and original field names

## HTML Attribute Best Practices

### 1. Tool Naming (`tool-name`)

**DO:**
- Use descriptive, action-oriented names
- Include context for update/delete operations
- Keep names under 64 characters

**DON'T:**
- Use Ruby string interpolation directly (e.g., `#{user.id}`)
- Include special characters beyond `a-zA-Z0-9_.-`

```erb
<!-- Good -->
tool-name="create-user"
tool-name="update-user-123"
tool-name="delete-role-admin"

<!-- Bad - will be auto-sanitized -->
tool-name="update-user-#{user.id}"  <!-- Ruby interpolation creates invalid chars -->
tool-name="create@user"              <!-- @ is invalid -->
```

### 2. Tool Descriptions (`tool-description`)

**DO:**
- Describe the action and outcome
- Mention if the action causes a redirect
- Indicate what new tools become available after redirect

**DON'T:**
- Leave descriptions empty
- Use technical jargon

```erb
<!-- Good -->
tool-description="Create a new user account. Redirects to user profile page with edit and delete tools."
tool-description="Update user settings. Redirects to updated user profile."
tool-description="Delete this role permanently. Redirects to roles list."

<!-- Bad -->
tool-description="Submit form"
tool-description=""
```

### 3. Parameter Descriptions (`tool-param-description`)

**DO:**
- Specify the data type explicitly for non-strings
- Include format requirements
- List valid options for selects/enums
- Mark optional parameters clearly

**DON'T:**
- Assume agents know Rails conventions
- Leave type ambiguous

```erb
<!-- Good examples for different input types -->

<!-- Text fields -->
<%= form.text_field :email,
    "tool-param-description" => "User's email address (string, valid email format)" %>

<!-- Password fields -->
<%= form.password_field :password,
    "tool-param-description" => "User password (string, minimum 8 characters)" %>

<!-- Number fields -->
<%= form.number_field :age,
    "tool-param-description" => "User's age (number, 18-120)" %>

<!-- Checkboxes - ALWAYS specify boolean -->
<%= form.check_box :active,
    "tool-param-description" => "Account status (boolean: true = active, false = inactive)" %>

<!-- Select dropdowns -->
<%= form.select :role, options_for_select(['admin', 'user', 'guest']),
    { prompt: 'Select role' },
    "tool-param-description" => "User role (string, options: admin, user, guest)" %>

<!-- Optional fields -->
<%= form.text_field :middle_name,
    "tool-param-description" => "Middle name (string, optional)" %>
```

## Type Handling

### Boolean Fields (Checkboxes)
The script automatically converts checkbox inputs to boolean schemas:
- Agents pass `true` or `false`
- Script converts to Rails format ("1" for true, unchecked for false)

### Number Fields
The script detects `type="number"` inputs:
- Creates `z.number()` schema
- Converts number to string for form submission

### String Fields (Default)
All other inputs default to string:
- Email inputs get format hint
- Select options are listed if ≤10 options

## Controller Response Patterns

### Implementing `render_for_agent`

Always include redirect information in agent responses:

```ruby
class UsersController < ApplicationController
  def create
    @user = User.new(user_params)

    if @user.save
      render_for_agent({
        success: true,
        message: "User created successfully",
        # Include the created resource data
        user: { id: @user.id, email: @user.email },
        # CRITICAL: Include redirect URL for proper navigation
        redirect_url: user_url(@user)
      }) do
        # Normal browser response
        redirect_to @user, notice: "User was successfully created."
      end
    else
      render_for_agent({
        success: false,
        errors: @user.errors.full_messages
      }) do
        render :new, status: :unprocessable_entity
      end
    end
  end

  def destroy
    @user.destroy!
    render_for_agent({
      success: true,
      message: "User deleted",
      # Redirect to index after deletion
      redirect_url: users_url
    }) do
      redirect_to users_path, notice: "User was successfully destroyed."
    end
  end
end
```

### Agent Response Keys

**Always include:**
- `success`: boolean indicating operation success
- `message`: human-readable status message
- `redirect_url`: where the agent should navigate after success

**Include when relevant:**
- Resource data (id, key attributes)
- `errors`: array of error messages on failure
- Additional context about available actions

## Navigation and Tool Discovery

### Link Tools
For navigation links that expose new tools:

```erb
<%= link_to "Edit User", edit_user_path(@user),
    "tool-name" => "edit-user-#{@user.id}",
    "tool-description" => "Navigate to user edit form with update and cancel tools" %>

<%= link_to "View Roles", roles_path,
    "tool-name" => "view-roles",
    "tool-description" => "Navigate to roles list. Provides create, edit, and delete role tools." %>
```

### Form Actions
Describe what happens after form submission:

```erb
<%= form_with(model: user,
    "tool-name" => "create-user",
    "tool-description" => "Create new user. On success, redirects to user profile with edit/delete tools. On failure, returns validation errors.") do |form| %>
```

## Complete Example

### View (Form)
```erb
<%= form_with(model: @product,
    "tool-name" => @product.new_record? ? "create-product" : "update-product-#{@product.id}",
    "tool-description" => @product.new_record? ?
      "Create new product. Redirects to product page with edit/delete tools." :
      "Update product details. Redirects to updated product page.") do |form| %>

  <%= form.text_field :name,
      required: true,
      "tool-param-description" => "Product name (string, required, 1-100 characters)" %>

  <%= form.number_field :price,
      required: true,
      "tool-param-description" => "Product price (number, required, minimum 0)" %>

  <%= form.check_box :featured,
      "tool-param-description" => "Featured status (boolean: true = featured, false = normal)" %>

  <%= form.select :category,
      options_for_select(['Electronics', 'Clothing', 'Food', 'Books']),
      { prompt: 'Select category' },
      "tool-param-description" => "Product category (string, options: Electronics, Clothing, Food, Books)" %>

  <%= form.text_area :description,
      "tool-param-description" => "Product description (string, optional, max 500 characters)" %>

  <%= form.submit %>
<% end %>
```

### Controller
```ruby
class ProductsController < ApplicationController
  def create
    @product = Product.new(product_params)

    if @product.save
      render_for_agent({
        success: true,
        message: "Product created",
        product: {
          id: @product.id,
          name: @product.name,
          price: @product.price
        },
        redirect_url: product_url(@product),
        available_actions: ["edit", "delete", "duplicate"]
      }) do
        redirect_to @product, notice: "Product was successfully created."
      end
    else
      render_for_agent({
        success: false,
        errors: @product.errors.full_messages,
        validation_details: @product.errors.details
      }) do
        render :new, status: :unprocessable_entity
      end
    end
  end
end
```

## Common Pitfalls to Avoid

1. **Missing type information for non-strings**: Always specify boolean, number, etc.
2. **No redirect_url in controller responses**: Agents won't know where to navigate
3. **Unclear tool descriptions**: Agents won't understand the tool's purpose
4. **Assuming Rails conventions**: Agents don't know Rails' "1"/"0" checkbox convention
5. **Missing parameter descriptions**: Agents will guess incorrectly
6. **Not mentioning redirects**: Agents won't know new tools will be available
7. **Invalid characters in tool names**: Use only `a-zA-Z0-9_.-`

## Testing Your Implementation

1. **Verify tool registration**: Check browser console for registered tools
2. **Test with an agent**: Have an agent attempt to use the tool
3. **Check type conversions**: Ensure booleans, numbers work correctly
4. **Verify redirects**: Confirm agent navigates after form submission
5. **Validate error handling**: Test with invalid data

## Summary Checklist

- [ ] All forms have `tool-name` and `tool-description` attributes
- [ ] All form inputs have `tool-param-description` with type info
- [ ] Checkboxes explicitly mention "boolean" in description
- [ ] Controllers include `redirect_url` in agent responses
- [ ] Tool descriptions mention redirects and available actions
- [ ] Tool names use only valid characters
- [ ] Optional parameters marked as "optional" in descriptions
- [ ] Select/enum options listed in descriptions
- [ ] Format requirements specified (email, min/max, etc.)