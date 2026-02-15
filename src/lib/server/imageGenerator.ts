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

  // 1. Fetch Fonts (Only Text Font needed now)
  const fontData = await fetchFont(
    'https://cdn.jsdelivr.net/fontsource/fonts/courier-prime@latest/latin-400-normal.ttf', 
    'Text Font'
  );

  if (!fontData) {
    throw new Error('Critical: Could not load primary Text Font.');
  }

  // 2. Build Font List
  const fontsList: any[] = [
    {
      name: 'Courier Prime',
      data: fontData,
      weight: 400,
      style: 'normal',
    }
  ];

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
                fontFamily: 'Courier Prime', // Just the standard font
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
      fonts: fontsList,
      // 4. Handle Emojis dynamically using loadAdditionalAsset
      // 4. Handle Emojis dynamically using loadAdditionalAsset
      loadAdditionalAsset: async (code: string, segment: string) => {
        if (code === 'emoji') {
          // This fetches the raw SVG string, guaranteeing it renders locally and in production
          return await getEmojiSvg(segment);
        }
        return '';
      },
    }
  );

  console.log(`[ImageGen] SVG created. Converting to PNG...`);

  // 5. Convert to PNG
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1080 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  
  console.log(`[ImageGen] PNG Created. Size: ${pngBuffer.length}`);
  return pngBuffer;
}

// Helper to decode complex emojis and fetch their raw SVG data
async function getEmojiSvg(segment: string) {
  // 1. Remove invisible variation selectors (like the one attached to ❤️)
  const cleanStr = segment.replace(/\uFE0F/g, '');
  
  // 2. Properly decode all parts of the emoji (handles combined emojis)
  const codes = [];
  for (const char of cleanStr) {
    const pt = char.codePointAt(0);
    if (pt) codes.push(pt.toString(16));
  }
  const emojiCode = codes.join('-');

  // 3. Fetch the raw SVG text directly
  try {
    const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${emojiCode}.svg`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (res.ok) {
      const svgText = await res.text();
      // FIX: Convert the raw SVG string into a valid Base64 Data URI
      const base64 = Buffer.from(svgText).toString('base64');
      return `data:image/svg+xml;base64,${base64}`;
    }
  } catch (e) {
    console.error(`[ImageGen] Failed to load emoji ${emojiCode}`, e);
  }
  return '';
}

