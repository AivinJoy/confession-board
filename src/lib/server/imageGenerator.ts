import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Helper to fetch a font
async function getFontData() {
  // CHANGED: Using the raw GitHub link which acts as a stable CDN for the TTF file
  const response = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/courierprime/CourierPrime-Regular.ttf');
  
  if (!response.ok) {
    throw new Error('Failed to fetch font file');
  }

  return await response.arrayBuffer();
}

export async function generateStickyImage(text: string, color: string, id: number) {
  const fontData = await getFontData();

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
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1080 },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}