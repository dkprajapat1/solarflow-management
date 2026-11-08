import { NextResponse } from 'next/server';
import { getCompanyCurrentUser, ensureDemoCompanyUsers } from '@/lib/auth.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDemoCompanyUsers();
    const user = await getCompanyCurrentUser();
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
