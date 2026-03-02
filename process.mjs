import sharp from 'sharp';

async function processImage() {
    const file = 'C:/Users/Cliente/.gemini/antigravity/brain/65ffcfa8-1267-46a4-bf11-3f6defb50e66/media__1772479340872.png';
    const out = 'public/images/author.png';

    // Create an SVG mask - ellipse fading out
    const mask = Buffer.from(`
    <svg width="474" height="600" viewBox="0 0 474 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stop-color="white" stop-opacity="1"/>
          <stop offset="90%" stop-color="white" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="237" cy="300" rx="220" ry="280" fill="url(#grad)" />
    </svg>
  `);

    await sharp(file)
        .extract({ left: 0, top: 212, width: 474, height: 600 })
        .composite([
            {
                input: mask,
                blend: 'dest-in'
            }
        ])
        .webp({ quality: 90 })
        .toFile('public/images/author.webp');

    console.log("Image processed and saved to public/images/author.webp");
}

processImage().catch(console.error);
