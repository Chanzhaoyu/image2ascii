import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

function generateAscii(pixels: Buffer, width: number, height: number): string {
  // 修改 ASCII 字符集，从暗到亮的顺序
  const asciiChars = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'.  ';
  let ascii = '';

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = (y * width + x) * 1;
      const gray = pixels[pos];

      // 增强对比度
      const adjustedGray = Math.pow(gray / 255, 0.8) * 255; // gamma 校正
      const charIndex = Math.floor((adjustedGray / 255) * (asciiChars.length - 1));

      // 使用两个字符来增加密度
      ascii += asciiChars[charIndex] + asciiChars[charIndex];
    }
    ascii += '\n';
  }

  return ascii;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 修改图片处理流程
    const resizedImage = await sharp(buffer)
      .resize({
        width: 80,  // 减小宽度因为我们现在用两个字符表示一个像素
        height: 40,
        fit: 'fill'
      })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    console.log('Image processing result:', {
      width: resizedImage.info.width,
      height: resizedImage.info.height,
      channels: resizedImage.info.channels,
      size: resizedImage.data.length
    });

    const ascii = generateAscii(
      resizedImage.data,
      resizedImage.info.width,
      resizedImage.info.height
    );

    if (!ascii) {
      throw new Error('ASCII generation failed');
    }

    return NextResponse.json({ ascii });
  } catch (error: any) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: "Failed to process image", details: error.message },
      { status: 500 }
    );
  }
}