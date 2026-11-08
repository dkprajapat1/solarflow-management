import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db.js';
import User from '@/models/User.js';
import { ensureDemoCompanyUsers } from '@/lib/auth.js';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    await ensureDemoCompanyUsers();

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      role: { $in: ['admin', 'sales'] },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials or unauthorized role. Only Sales & Admin can access.' },
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

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      message: 'Company login successful',
    });

    response.cookies.set({
      name: 'sf_company_user',
      value: encodeURIComponent(JSON.stringify(sessionPayload)),
      httpOnly: false,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Company login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    );
  }
}
