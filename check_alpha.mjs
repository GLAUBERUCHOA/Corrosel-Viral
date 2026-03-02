import sharp from 'sharp';

async function check() {
    const meta = await sharp('C:/Users/Cliente/.gemini/antigravity/brain/65ffcfa8-1267-46a4-bf11-3f6defb50e66/media__1772479340872.png').metadata();
    console.log(`Dimensions: ${meta.width}x${meta.height}, Channels: ${meta.channels}, hasAlpha: ${meta.hasAlpha}`);

    // Get raw pixels
    const { data, info } = await sharp('C:/Users/Cliente/.gemini/antigravity/brain/65ffcfa8-1267-46a4-bf11-3f6defb50e66/media__1772479340872.png')
        .raw()
        .toBuffer({ resolveWithObject: true });

    let isAlphaReal = false;
    if (meta.channels === 4) {
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) {
                isAlphaReal = true;
                break;
            }
        }
    }
    console.log(`Real alpha transparency: ${isAlphaReal}`);
}

check().catch(console.error);
