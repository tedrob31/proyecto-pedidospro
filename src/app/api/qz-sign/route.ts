import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const toSign = searchParams.get('request');

  if (!toSign) {
    return new Response('Missing request parameter', { status: 400 });
  }

  const privateKey = process.env.QZ_PRIVATE_KEY;
  
  // Si no hay llave privada en entorno, significa que no estamos usando certificados firmados (ej. en desarrollo)
  if (!privateKey) {
    console.warn("QZ_PRIVATE_KEY no configurado en entorno. Omitiendo firma.");
    return new Response('', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  try {
    const sign = crypto.createSign('sha512');
    sign.update(toSign);
    
    // QZ Tray espera el signature en Base64
    const signature = sign.sign(privateKey.replace(/\\n/g, '\n'), 'base64');
    
    return new Response(signature, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        // Evitar problemas de CORS si la API es llamada desde otro origen
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    console.error("Error firmando peticion QZ:", error);
    return new Response('Error signing request', { status: 500 });
  }
}
