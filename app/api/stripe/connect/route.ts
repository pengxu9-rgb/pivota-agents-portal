import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://web-production-fedb.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    
    console.log('[Stripe Connect Proxy] Request received:', {
      body,
      hasAuth: !!authHeader,
      authHeader: authHeader ? authHeader.substring(0, 20) + '...' : 'none'
    });
    
    if (!authHeader) {
      return NextResponse.json(
        { detail: 'Missing authorization' },
        { status: 401 }
      );
    }
    
    // Forward request to backend
    console.log('[Stripe Connect Proxy] Forwarding to backend:', `${BACKEND_URL}/stripe-connect/onboard`);
    
    const response = await fetch(`${BACKEND_URL}/stripe-connect/onboard`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    console.log('[Stripe Connect Proxy] Backend response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });
    
    // Check if response is OK and has JSON content
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    if (!response.ok) {
      let errorMessage = `Backend error: ${response.status}`;
      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
      } else {
        // Try to read as text
        try {
          errorMessage = await response.text();
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
      }
      
      console.error('[Stripe Connect Proxy] Backend error:', errorMessage);
      return NextResponse.json(
        { detail: errorMessage },
        { status: response.status }
      );
    }
    
    // Parse successful response
    const data = isJson ? await response.json() : { message: await response.text() };
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
    
  } catch (error: any) {
    console.error('[Stripe Connect Proxy] Error:', error);
    return NextResponse.json(
      { detail: error.message || 'Failed to connect with Stripe' },
      { status: 502 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
