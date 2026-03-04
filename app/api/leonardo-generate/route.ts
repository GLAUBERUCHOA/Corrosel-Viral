import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt, apiKey, width, height } = body;

        if (!prompt || !apiKey) {
            return NextResponse.json({ error: 'Missing prompt or apiKey' }, { status: 400 });
        }

        console.log('[leonardo-generate] Starting generation...');

        // Step 1: Create generation
        const initRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                modelId: 'b24e16ff-06e3-43eb-8d33-4416c2d75876', // Leonardo Diffusion XL
                width: width || 768,
                height: height || 960,
                num_images: 1,
            }),
        });

        if (!initRes.ok) {
            const errorText = await initRes.text();
            console.error('[leonardo-generate] Init failed:', errorText);
            return NextResponse.json({ error: `Leonardo API error: ${initRes.status}` }, { status: initRes.status });
        }

        const initData = await initRes.json();
        const generationId = initData?.sdGenerationJob?.generationId;
        if (!generationId) {
            console.error('[leonardo-generate] No generationId:', JSON.stringify(initData));
            return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 });
        }

        console.log(`[leonardo-generate] generationId: ${generationId}`);

        // Step 2: Poll for completion (up to 120s = 40 x 3s)
        for (let attempt = 0; attempt < 40; attempt++) {
            await new Promise(r => setTimeout(r, 3000));

            const pollRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });

            if (!pollRes.ok) {
                console.warn(`[leonardo-generate] Poll ${attempt + 1} HTTP ${pollRes.status}`);
                continue;
            }

            const pollData = await pollRes.json();
            const images = pollData?.generations_by_pk?.generated_images;

            console.log(`[leonardo-generate] Poll ${attempt + 1}: ${images?.length ?? 0} images`);

            if (images && images.length > 0) {
                const imageUrl = images[0].url;

                // Download the image and turn it into base64
                try {
                    const imgRes = await fetch(imageUrl);
                    if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);

                    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
                    const buffer = await imgRes.arrayBuffer();
                    const base64 = Buffer.from(buffer).toString('base64');

                    console.log(`[leonardo-generate] Image fetched: ${buffer.byteLength} bytes`);

                    return NextResponse.json({
                        dataUrl: `data:${contentType};base64,${base64}`,
                        mimeType: contentType,
                        bytes: buffer.byteLength,
                    });
                } catch (fetchErr) {
                    console.error('[leonardo-generate] Failed to fetch final image:', fetchErr);
                    // Return the URL anyway as fallback
                    return NextResponse.json({ url: imageUrl });
                }
            }
        }

        return NextResponse.json({ error: 'Generation timed out after 120s' }, { status: 504 });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[leonardo-generate] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
