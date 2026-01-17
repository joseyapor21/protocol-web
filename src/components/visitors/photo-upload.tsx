'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { VisitorPhoto } from '@/types';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface PhotoUploadProps {
  photos: VisitorPhoto[];
  onPhotosChange: (photos: VisitorPhoto[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  disabled = false,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;

      const remainingSlots = maxPhotos - photos.length;
      if (remainingSlots <= 0) {
        setError(`Maximum ${maxPhotos} photos allowed`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      const validFiles = filesToUpload.filter((file) => {
        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed');
          return false;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('File size must be less than 10MB');
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      const newPhotos: VisitorPhoto[] = [];
      for (let i = 0; i < validFiles.length; i++) {
        try {
          const photo = await uploadToCloudinary(validFiles[i]);
          newPhotos.push(photo);
          setUploadProgress(((i + 1) / validFiles.length) * 100);
        } catch (err) {
          console.error('Upload error:', err);
          setError(err instanceof Error ? err.message : 'Upload failed');
        }
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
      }

      setIsUploading(false);
      setUploadProgress(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [photos, onPhotosChange, maxPhotos, disabled]
  );

  const handleRemovePhoto = useCallback(
    (index: number) => {
      const newPhotos = photos.filter((_, i) => i !== index);
      onPhotosChange(newPhotos);
    },
    [photos, onPhotosChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-600">Uploading... {Math.round(uploadProgress)}%</p>
            <div className="w-48 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-gray-600">
              Drag and drop photos here, or click to select
            </p>
            <p className="text-xs text-gray-400">
              {photos.length} / {maxPhotos} photos • Max 10MB per file
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {photos.map((photo, index) => (
            <div
              key={photo.publicId || index}
              className="relative aspect-square rounded-lg overflow-hidden group"
            >
              <img
                src={photo.url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePhoto(index);
                  }}
                  className="
                    absolute top-1 right-1 p-1 rounded-full
                    bg-red-500 text-white opacity-0 group-hover:opacity-100
                    transition-opacity duration-200 hover:bg-red-600
                  "
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {/* Add more button */}
          {photos.length < maxPhotos && !disabled && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="
                aspect-square rounded-lg border-2 border-dashed border-gray-300
                flex flex-col items-center justify-center gap-1
                text-gray-400 hover:text-gray-500 hover:border-gray-400
                transition-colors duration-200
              "
            >
              <ImageIcon className="w-6 h-6" />
              <span className="text-xs">Add</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
