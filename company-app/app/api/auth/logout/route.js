import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out of company portal',
  });

  response.cookies.set({
    name: 'sf_company_user',
    value: '',
    path: '/',
    maxAge: 0,
  });

  return response;
}
