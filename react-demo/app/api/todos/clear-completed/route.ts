import { NextRequest, NextResponse } from 'next/server';
import { clearCompleted } from '../../../../lib/todos';

export async function POST(request: NextRequest) {
  try {
    // Remove all completed todos
    clearCompleted();

    // Redirect back to the main page
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Error clearing completed todos:', error);
    return NextResponse.json({ error: 'Failed to clear completed todos' }, { status: 500 });
  }
}