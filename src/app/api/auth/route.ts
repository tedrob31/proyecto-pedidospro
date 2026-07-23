import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Check against env variable
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (password === adminPassword) {
      // Set cookie
      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: 'auth_token',
        value: 'authenticated',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      return response;
    }
    
    return NextResponse.json({ success: false, message: 'Contraseña incorrecta' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error procesando la solicitud' }, { status: 500 });
  }
}
