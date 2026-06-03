import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Clear authentication cookies or session
    const response = NextResponse.json({ success: true });

    // Clear auth cookies
    response.cookies.delete('auth-token');
    response.cookies.delete('session');

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
