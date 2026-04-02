import { NextResponse } from 'next/server';

const PASSCODE = '0923';

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (password === PASSCODE) {
      const res = NextResponse.json({ success: true });
      res.cookies.set('vsl_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
      return res;
    }

    return NextResponse.json({ success: false, error: 'Wrong password' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
