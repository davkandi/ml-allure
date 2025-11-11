import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'ML Allure Next.js API is running',
    timestamp: new Date().toISOString(),
  });
}
