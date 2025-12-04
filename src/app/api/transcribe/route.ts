import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

/**
 * POST /api/transcribe
 * Transcribe audio using Deepgram REST API
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = (formData.get('language') as string) || 'zh-CN';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 });
    }

    const deepgram = createClient(apiKey);
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    console.log('[Transcribe] Processing audio, size:', audioBuffer.length, 'language:', language);

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: 'nova-2',
        language: language,
        smart_format: true,
        punctuate: true,
      }
    );

    if (error) {
      console.error('[Transcribe] Deepgram error:', error);
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }

    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    console.log('[Transcribe] Result:', transcript);

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('[Transcribe] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

