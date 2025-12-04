import { NextResponse } from 'next/server';

/**
 * GET /api/deepgram
 * Returns the Deepgram API key for client-side streaming
 *
 * Note: In production, you should create temporary ephemeral keys
 * using the Deepgram Management API for better security.
 * For now, we're returning the main API key for simplicity.
 */
export async function GET() {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      console.error('[deepgram] DEEPGRAM_API_KEY not found in environment');
      return NextResponse.json(
        { error: 'Deepgram API key not configured' },
        { status: 500 }
      );
    }

    // For production, implement temporary key generation:
    // const deepgram = createClient(apiKey);
    // const { result, error } = await deepgram.manage.createProjectKey(
    //   process.env.DEEPGRAM_PROJECT_ID || '',
    //   {
    //     comment: 'Temporary key for client-side streaming',
    //     scopes: ['usage:write'],
    //     time_to_live_in_seconds: 10,
    //   }
    // );

    return NextResponse.json({ key: apiKey });
  } catch (error) {
    console.error('[deepgram] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

