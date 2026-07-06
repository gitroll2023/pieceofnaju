// 사진 등록 전처리 — react-easy-crop의 잘라낸 영역을 고정 규격 WebP로 압축.
"use client";

export type CropPixels = { x: number; y: number; width: number; height: number };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** 원본 이미지의 잘라낸 영역(cropPixels)을 targetSize×targetSize WebP Blob으로 렌더링 */
export async function cropAndCompress(
  imageSrc: string,
  cropPixels: CropPixels,
  targetSize = 1080,
  quality = 0.82,
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("캔버스를 사용할 수 없어요");
  ctx.drawImage(
    img,
    cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
    0, 0, targetSize, targetSize,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("이미지 압축 실패"))),
      "image/webp",
      quality,
    );
  });
}
