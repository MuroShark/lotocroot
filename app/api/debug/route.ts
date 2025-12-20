import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const root = process.cwd();
  const info: any = {
    rootPath: root,
    filesInRoot: [],
    nextFolder: 'MISSING',
    staticFolder: 'MISSING'
  };

  try {
    // 1. Смотрим корень
    info.filesInRoot = fs.readdirSync(root);

    // 2. Ищем папку .next
    const nextPath = path.join(root, '.next');
    if (fs.existsSync(nextPath)) {
      info.nextFolder = fs.readdirSync(nextPath);
      
      // 3. Ищем статику (где должны лежать CSS)
      const staticPath = path.join(nextPath, 'static');
      if (fs.existsSync(staticPath)) {
        info.staticFolder = fs.readdirSync(staticPath);
        // Глубокая проверка CSS chunks
        const chunksPath = path.join(staticPath, 'chunks');
        if (fs.existsSync(chunksPath)) {
             info.chunksFolder = fs.readdirSync(chunksPath);
        }
      }
    }
  } catch (error: any) {
    info.error = error.message;
  }

  return NextResponse.json(info);
}