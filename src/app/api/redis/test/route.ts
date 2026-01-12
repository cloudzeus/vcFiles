import { NextResponse } from 'next/server';
import { testRedisConnection } from '@/lib/redis';

export async function GET() {
  // Redis is disabled - using MySQL only
  return NextResponse.json({
    success: true,
    connected: false,
    disabled: true,
    message: 'Redis is disabled. Using MySQL only.',
    timestamp: new Date().toISOString()
  });
}
