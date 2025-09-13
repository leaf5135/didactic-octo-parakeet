import { NextRequest, NextResponse } from 'next/server';
import { deleteTodo } from '../../../../lib/todos';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const idStr = formData.get('id') as string;
    
    if (!idStr) {
      return NextResponse.json({ error: 'Todo ID is required' }, { status: 400 });
    }

    const id = parseInt(idStr, 10);
    const deleted = deleteTodo(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Redirect back to the main page
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}