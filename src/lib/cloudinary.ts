import { VisitorPhoto } from '@/types';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export async function uploadToCloudinary(file: File): Promise<VisitorPhoto> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration is missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your environment variables.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'protocol-visitors');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload image');
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
    uploadedAt: new Date().toISOString(),
  };
}

export async function uploadMultipleToCloudinary(files: File[]): Promise<VisitorPhoto[]> {
  const uploadPromises = files.map(file => uploadToCloudinary(file));
  return Promise.all(uploadPromises);
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  // Note: Deletion requires server-side API with signature
  // For now, we'll just return true and handle cleanup separately
  // In production, you'd want an API route that handles this with the API secret
  console.warn('Cloudinary deletion requires server-side implementation');
  return true;
}
