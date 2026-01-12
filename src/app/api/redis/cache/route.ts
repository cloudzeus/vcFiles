import { NextRequest, NextResponse } from 'next/server';
import { cacheSet, cacheGet, cacheDelete, cacheClear } from '@/lib/redis';

export async function GET(request: NextRequest) {
  // Redis is disabled - using MySQL only
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  
  return NextResponse.json({
    success: true,
    key,
    value: null,
    disabled: true,
    message: 'Redis is disabled. Using MySQL only.',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  // Redis is disabled - using MySQL only
  const body = await request.json();
  const { key, value, ttl = 3600 } = body;
  
  return NextResponse.json({
    success: false,
    key,
    ttl,
    disabled: true,
    message: 'Redis is disabled. Using MySQL only.',
    timestamp: new Date().toISOString()
  });
}

export async function DELETE(request: NextRequest) {
  // Redis is disabled - using MySQL only
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const clearAll = searchParams.get('clearAll') === 'true';
  
  return NextResponse.json({
    success: false,
    key,
    action: clearAll ? 'clearAll' : 'delete',
    disabled: true,
    message: 'Redis is disabled. Using MySQL only.',
    timestamp: new Date().toISOString()
  });
}
