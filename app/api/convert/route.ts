import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

function generateAscii(pixels: Buffer, width: number, height: number): string {
  // 修改 ASCII 字符集，从暗到亮的顺序
  const asciiChars = '@#8&WM%*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ';
  let ascii = '';

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = (y * width + x) * 1; // 修改为1，因为grayscale图片每像素只有一个值
      const gray = pixels[pos];

      // 根据灰度值选择对应的ASCII字符
      const charIndex = Math.floor((gray / 255) * (asciiChars.length - 1));
      ascii += asciiChars[charIndex];
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
        width: 100,
        height: 50,
        fit: 'fill'
      })
      .grayscale() // 转换为灰度图
      .raw() // 获取原始像素数据
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