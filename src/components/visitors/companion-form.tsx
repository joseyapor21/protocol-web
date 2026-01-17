'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { VisitorPhoto } from '@/types';
import { PhotoUpload } from './photo-upload';

const companionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  notes: z.string().optional(),
});

export interface CompanionData {
  name: string;
  phone: string;
  notes?: string;
  photos: VisitorPhoto[];
}

interface CompanionFormProps {
  index: number;
  defaultValues?: Partial<CompanionData>;
  onChange: (data: CompanionData, isValid: boolean) => void;
  disabled?: boolean;
}

export function CompanionForm({ index, defaultValues, onChange, disabled }: CompanionFormProps) {
  const [photos, setPhotos] = useState<VisitorPhoto[]>(defaultValues?.photos || []);

  const {
    register,
    watch,
    formState: { errors, isValid },
  } = useForm<{ name: string; phone: string; notes?: string }>({
    resolver: zodResolver(companionSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      phone: defaultValues?.phone || '',
      notes: defaultValues?.notes || '',
    },
    mode: 'onChange',
  });

  // Watch all fields
  const watchedName = watch('name');
  const watchedPhone = watch('phone');
  const watchedNotes = watch('notes');

  // Update parent whenever form changes
  useEffect(() => {
    const data: CompanionData = {
      name: watchedName,
      phone: watchedPhone,
      notes: watchedNotes,
      photos,
    };
    const valid = watchedName.length > 0 && watchedPhone.length > 0;
    onChange(data, valid);
  }, [watchedName, watchedPhone, watchedNotes, photos, onChange]);

  const handlePhotosChange = (newPhotos: VisitorPhoto[]) => {
    setPhotos(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-purple-200 p-4">
        <h4 className="text-md font-medium text-purple-700 mb-3">
          Companion {index + 1} - Personal Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Name *"
            placeholder="Full name"
            error={errors.name?.message}
            {...register('name')}
            disabled={disabled}
          />
          <Input
            label="Phone *"
            placeholder="Phone number"
            type="tel"
            error={errors.phone?.message}
            {...register('phone')}
            disabled={disabled}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            placeholder="Any notes for this companion..."
            className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
            {...register('notes')}
            disabled={disabled}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
          <PhotoUpload
            photos={photos}
            onPhotosChange={handlePhotosChange}
            maxPhotos={5}
            disabled={disabled}
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 italic">
        Travel details (arrival, departure, hotel, driver) will be shared from the primary visitor.
      </p>
    </div>
  );
}
