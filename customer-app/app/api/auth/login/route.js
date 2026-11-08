import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db.js';
import User from '@/models/User.js';
import { ensureDemoCustomer } from '@/lib/auth.js';

export async function POST(request) {
  try {
    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    await ensureDemoCustomer();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const sessionPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      message: 'Login successful',
    });

    response.cookies.set({
      name: 'sf_customer_user',
      value: encodeURIComponent(JSON.stringify(sessionPayload)),
      httpOnly: false,
      path: '/',
      maxAge,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    );
  }
}
