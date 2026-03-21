import { fileToDataUrl } from './fileToDataUrl';

const MAX_WIDTH = 2200;
const QUALITY = 0.9;

export async function imageFileToDataUrl(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files can be embedded.');
  }

  const bitmap = await createImageBitmap(file);
  if (bitmap.width <= MAX_WIDTH) {
    return fileToDataUrl(file);
  }

  const scale = MAX_WIDTH / bitmap.width;
  const canvas = document.createElement('canvas');
  canvas.width = MAX_WIDTH;
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');

  if (!context) {
    return fileToDataUrl(file);
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', QUALITY);
}
