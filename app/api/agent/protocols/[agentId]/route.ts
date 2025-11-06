import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BACKEND_URL = 'https://web-production-fedb.up.railway.app';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  if (!agentId) {
    return NextResponse.json(
      { detail: 'Missing agentId' },
      { status: 400 }
    );
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Get authorization header from client request
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    console.log('[Proxy] Fetching protocols for agent:', agentId);
    console.log('[Proxy] Auth header present:', !!authHeader);

    // Add trailing slash to match backend routing
    const response = await fetch(
      `${BACKEND_URL}/agents/${agentId}/protocols/`,
      {
        method: 'GET',
        headers,
        cache: 'no-store',
        redirect: 'follow', // Follow redirects on server side
      }
    );

    console.log('[Proxy] Backend response status:', response.status);

    if (!response.ok) {
      const data = await response.text().catch(() => '');
      console.error(`[Proxy] Backend error ${response.status}:`, data);
      
      // Better error messages
      let errorDetail = data || response.statusText;
      if (response.status === 403) {
        errorDetail = 'Access denied. Please login to view protocols.';
      } else if (response.status === 404) {
        errorDetail = 'Agent not found or no protocols configured.';
      }
      
      return NextResponse.json(
        { detail: errorDetail },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Proxy] Successfully fetched protocols, count:', data?.length || data?.protocols?.length || 0);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('[Proxy] Failed to fetch agent protocols:', error);
    return NextResponse.json(
      { detail: error?.message || 'Failed to load protocols' },
      { status: 502 }
    );
  }
}

