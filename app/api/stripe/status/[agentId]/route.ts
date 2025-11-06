import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://web-production-fedb.up.railway.app';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { detail: 'Missing authorization' },
        { status: 401 }
      );
    }
    
    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/stripe-connect/status/${agentId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
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
          errorMessage = response.statusText || errorMessage;
        }
      } else {
        try {
          errorMessage = await response.text();
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
      }
      
      console.error('[Stripe Status Proxy] Backend error:', errorMessage);
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
    console.error('[Stripe Status Proxy] Error:', error);
    return NextResponse.json(
      { detail: error.message || 'Failed to get status' },
      { status: 502 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
