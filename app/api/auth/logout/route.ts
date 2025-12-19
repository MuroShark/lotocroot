import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Удаляем Access Token
  response.cookies.set('da_access_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  
  // Удаляем Refresh Token
  response.cookies.set('da_refresh_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  
  return response;
}