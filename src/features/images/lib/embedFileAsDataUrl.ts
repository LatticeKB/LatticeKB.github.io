import { fileToDataUrl } from './fileToDataUrl';
import { imageFileToDataUrl } from './imageCompression';

export async function embedFileAsDataUrl(file: File) {
  if (file.type.startsWith('image/')) {
    return imageFileToDataUrl(file);
  }

  return fileToDataUrl(file);
}
