import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Helper to fetch fonts safely
async function fetchFont(url: string, name: string) {
  try {
    console.log(`[ImageGen] Fetching ${name}...`);
    const response = await fetch(url, {
      headers: {
        // Some CDNs require a User-Agent to verify it's not a bot attack
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${name}: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    console.log(`[ImageGen] Success: ${name} loaded (${buffer.byteLength} bytes)`);
    return buffer;
  } catch (e) {
    console.error(`[ImageGen] Error loading ${name}:`, e);
    return null; // Return null instead of crashing
  }
}

export async function generateStickyImage(text: string, color: string, id: number) {
  console.log(`[ImageGen] Starting generation for #${id}`);

  // 1. Fetch Fonts (Parallel)
  // We use reliable CDNs. 
  const [fontData, emojiData] = await Promise.all([
    fetchFont('https://cdn.jsdelivr.net/fontsource/fonts/courier-prime@latest/latin-400-normal.ttf', 'Text Font'),
    fetchFont('https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/fonts/NotoEmoji-Regular.ttf', 'Emoji Font')
  ]);

  if (!fontData) {
    throw new Error('Critical: Could not load primary Text Font.');
  }

  // 2. Build Font List
  // We always add the Text Font. We only add Emoji font if it loaded successfully.
  const fontsList: any[] = [
    {
      name: 'Courier Prime',
      data: fontData,
      weight: 400,
      style: 'normal',
    }
  ];

  if (emojiData) {
    fontsList.push({
      name: 'Noto Emoji',
      data: emojiData,
      weight: 400,
      style: 'normal',
    });
  }

  // 3. Generate SVG
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: color,
          padding: '60px',
          position: 'relative',
        },
        children: [
          // Serial Number
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '30px',
                right: '40px',
                fontSize: '40px',
                fontFamily: 'Courier Prime',
                opacity: 0.5,
                fontWeight: 'bold',
                color: 'black'
              },
              children: `#${id}`,
            },
          },
          // Content
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                fontSize: '48px',
                fontFamily: 'Courier Prime',
                color: '#1a1a1a',
                lineHeight: '1.4',
                marginTop: '40px',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              },
              children: text,
            },
          },
          // Watermark
          {
             type: 'div',
             props: {
               style: {
                 position: 'absolute',
                 bottom: '30px',
                 left: '0', 
                 width: '100%',
                 textAlign: 'center',
                 fontSize: '24px',
                 fontFamily: 'Courier Prime',
                 opacity: 0.4,
               },
               children: '@vast_confessions_official'
             }
          }
        ],
      },
    },
    {
      width: 1080,
      height: 1080,
      fonts: fontsList, // Use our dynamic list
    }
  );

  console.log(`[ImageGen] SVG created. Converting to PNG...`);

  // 4. Convert to PNG
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1080 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  
  console.log(`[ImageGen] PNG Created. Size: ${pngBuffer.length}`);
  return pngBuffer;
}