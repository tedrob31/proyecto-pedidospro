import { v2 as cloudinary } from 'cloudinary';

// Configuramos cloudinary usando la variable de entorno CLOUDINARY_URL
// Esto tomará automáticamente la configuración si CLOUDINARY_URL existe
cloudinary.config({
  secure: true
});

export async function uploadImage(base64Image: string, folder: string, publicId?: string) {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
      public_id: publicId,
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { width: 800, crop: 'limit' },
        { quality: 'auto:eco' },
        { fetch_format: 'auto' }
      ]
    });
    return result;
  } catch (error) {
    console.error('Error al subir imagen a Cloudinary:', error);
    throw new Error('No se pudo subir la imagen a Cloudinary');
  }
}

export async function deleteImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error al eliminar imagen de Cloudinary:', error);
    throw new Error('No se pudo eliminar la imagen de Cloudinary');
  }
}

export function extractPublicIdFromUrl(url: string): string | null {
  if (!url) return null;
  const urlParts = url.split('/');
  const uploadIndex = urlParts.findIndex(p => p === 'upload');
  if (uploadIndex === -1) return null;
  
  let startIndex = uploadIndex + 1;
  if (urlParts[startIndex] && urlParts[startIndex].match(/^v\d+$/)) {
    startIndex++;
  }
  
  const publicIdWithExt = urlParts.slice(startIndex).join('/');
  if (!publicIdWithExt) return null;
  
  const lastDotIndex = publicIdWithExt.lastIndexOf('.');
  if (lastDotIndex === -1) return publicIdWithExt; // No extension
  
  return publicIdWithExt.substring(0, lastDotIndex);
}

export default cloudinary;
