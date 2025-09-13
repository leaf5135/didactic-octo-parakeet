// Types for MCP tool attributes
interface MCPToolAttributes {
  'tool-name': string;
  'tool-description'?: string;
}

interface MCPParamAttributes {
  'tool-param-description': string;
}

// Schema validation types (for future extensibility)
interface ParamSchema {
  type?: 'string' | 'number' | 'boolean';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
}

// Main MCP utility object
export const mcp = {
  /**
   * Creates attributes for MCP tool registration on forms and links
   * @param name - The tool name (will be used as the MCP tool identifier)
   * @param description - Optional description of what the tool does
   * @returns Object with tool-name and tool-description attributes
   */
  tool: (name: string, description?: string): MCPToolAttributes => ({
    'tool-name': name,
    ...(description && { 'tool-description': description })
  }),

  /**
   * Creates attributes for MCP parameter descriptions on form inputs
   * @param description - Description of what this parameter represents
   * @param schema - Optional schema validation (currently unused but reserved for future)
   * @returns Object with tool-param-description attribute
   */
  param: (description: string, schema?: ParamSchema): MCPParamAttributes => ({
    'tool-param-description': description
    // Note: schema is currently unused but reserved for future WebMCP spec extensions
  })
};

// Type exports for advanced usage
export type { MCPToolAttributes, MCPParamAttributes, ParamSchema };