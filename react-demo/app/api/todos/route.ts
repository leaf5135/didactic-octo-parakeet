import { NextRequest, NextResponse } from 'next/server';
import { getTodos, addTodo } from '../../../lib/todos';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const text = formData.get('text') as string;

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Todo text is required' }, { status: 400 });
    }

    addTodo(text);

    // Redirect back to the main page
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Error adding todo:', error);
    return NextResponse.json({ error: 'Failed to add todo' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(getTodos());
}