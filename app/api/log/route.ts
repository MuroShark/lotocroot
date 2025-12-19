import { NextResponse } from 'next/server';
// import logger from '../../../shared/lib/logger';

/**
 * @api {post} /api/log
 * @description Принимает логи с клиентской части и записывает их через серверный логгер.
 */
export async function POST(request: Request) {
  try {
    // const logData = await request.json();
    // // Используем наш pino-логгер для записи клиентского лога на сервере
    // logger.info({ clientLog: logData }, 'Client-side log received');
    return NextResponse.json({ success: true });
  } catch (error) {
    // logger.error({ error }, 'Failed to process client-side log');
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
