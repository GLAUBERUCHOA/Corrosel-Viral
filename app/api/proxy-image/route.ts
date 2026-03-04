import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Validate only allowed image providers
    const allowedHosts = [
        'image.pollinations.ai',
        'cdn.leonardo.ai',
        'storage.googleapis.com',
        'cloud.leonardo.ai',
    ];
    try {
        const parsed = new URL(imageUrl);
        const isAllowed = allowedHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
        if (!isAllowed) {
            console.warn(`[proxy-image] Blocked host: ${parsed.hostname}`);
            return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
        }
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    try {
        console.log(`[proxy-image] Fetching: ${imageUrl}`);

        // For Pollinations, retry up to 5 times with 4s delay (image can take up to 20s to generate)
        const isPollinations = imageUrl.includes('image.pollinations.ai');
        const maxAttempts = isPollinations ? 5 : 1;
        const retryDelay = 4000;

        let lastError: Error | null = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await fetch(imageUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 CarrosselViralBot/1.0',
                        'Accept': 'image/*,*/*',
                    },
                    // 30s timeout per attempt
                    signal: AbortSignal.timeout(30000),
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const contentType = response.headers.get('content-type') || 'image/jpeg';

                // Check it's actually an image
                if (!contentType.startsWith('image/')) {
                    throw new Error(`Not an image: ${contentType}`);
                }

                const buffer = await response.arrayBuffer();
                const base64 = Buffer.from(buffer).toString('base64');

                console.log(`[proxy-image] OK on attempt ${attempt}. Size: ${buffer.byteLength} bytes, type: ${contentType}`);

                return NextResponse.json({
                    dataUrl: `data:${contentType};base64,${base64}`,
                    mimeType: contentType,
                    bytes: buffer.byteLength,
                });
            } catch (err) {
                lastError = err as Error;
                console.warn(`[proxy-image] Attempt ${attempt}/${maxAttempts} failed: ${lastError.message}`);
                if (attempt < maxAttempts) {
                    await new Promise(r => setTimeout(r, retryDelay));
                }
            }
        }

        throw lastError ?? new Error('All attempts failed');
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[proxy-image] Final error: ${message}`);
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
