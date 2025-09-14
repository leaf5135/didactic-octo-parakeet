import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    let text: string;
    
    if (contentType?.includes('application/json')) {
      // Handle JSON requests from MCP
      const { text: jsonText } = await request.json();
      text = jsonText;
    } else {
      // Handle form data from web forms
      const formData = await request.formData();
      text = formData.get('text') as string;
    }

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Todo text is required' }, { status: 400 });
    }

    await convex.mutation(api.todo.createTodo, { text: text.trim() });

    // Return JSON for API calls, redirect for form submissions
    if (contentType?.includes('application/json')) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch (error) {
    console.error('Error adding todo:', error);
    return NextResponse.json({ error: 'Failed to add todo' }, { status: 500 });
  }
}