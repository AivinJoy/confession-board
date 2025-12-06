import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// 1. Fetch Text Font
async function getTextFont() {
  const response = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/courierprime/CourierPrime-Regular.ttf');
  if (!response.ok) throw new Error('Failed to fetch text font');
  return await response.arrayBuffer();
}

// 2. Fetch Emoji Font (Google Noto Emoji)
async function getEmojiFont() {
  // We use the 'Regular' monochrome version for better compatibility and speed with Satori
  // or use the CDN for Noto Color Emoji if you want full color (files are large, 10MB+)
  const response = await fetch('https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoEmoji-Regular.ttf');
  if (!response.ok) throw new Error('Failed to fetch emoji font');
  return await response.arrayBuffer();
}

export async function generateStickyImage(text: string, color: string, id: number) {
  // Load both fonts in parallel
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
                fontFamily: 'Courier Prime', // Satori will fallback to Emoji font automatically
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
        // 3. Register the Emoji Font
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