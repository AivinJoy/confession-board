import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// 1. Fetch Text Font (Courier Prime) via CDN
async function getTextFont() {
  // Using JSDelivr for stability
  const response = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/courier-prime@latest/latin-400-normal.ttf');
  
  if (!response.ok) {
    console.error("Text font failed:", response.status, response.statusText);
    throw new Error('Failed to fetch text font');
  }
  return await response.arrayBuffer();
}

// 2. Fetch Emoji Font (Noto Emoji) via CDN
async function getEmojiFont() {
  // FIXED: Using JSDelivr instead of raw GitHub link to avoid timeouts/redirect errors
  const response = await fetch('https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/fonts/NotoEmoji-Regular.ttf');
  
  if (!response.ok) {
    console.error("Emoji font failed:", response.status, response.statusText);
    throw new Error('Failed to fetch emoji font');
  }
  return await response.arrayBuffer();
}

export async function generateStickyImage(text: string, color: string, id: number) {
  // Fetch fonts in parallel
  const [fontData, emojiData] = await Promise.all([
    getTextFont(),
    getEmojiFont()
  ]);

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
      fonts: [
        {
          name: 'Courier Prime',
          data: fontData,
          weight: 400,
          style: 'normal',
        },
        // Emoji Font Registration
        {
          name: 'Noto Emoji',
          data: emojiData,
          weight: 400,
          style: 'normal',
        }
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1080 },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}