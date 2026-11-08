import { NextResponse } from 'next/server';
import { getCurrentUser, ensureDemoCustomer } from '@/lib/auth.js';

export async function GET() {
  try {
    await ensureDemoCustomer();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
