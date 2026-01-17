'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Visitor, VisitorFormData, VisitorPhoto } from '@/types';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { PhotoUpload } from './photo-upload';

const visitorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  arrivalDate: z.string().min(1, 'Arrival date is required'),
  arrivalTime: z.string().min(1, 'Arrival time is required'),
  airline: z.string().min(1, 'Airline is required'),
  flightNumber: z.string().min(1, 'Flight number is required'),
  driver: z.string().min(1, 'Driver name is required'),
  hotel: z.string().min(1, 'Hotel is required'),
  departureDate: z.string().min(1, 'Departure date is required'),
  departureTime: z.string().min(1, 'Departure time is required'),
  departureAirline: z.string().min(1, 'Departure airline is required'),
  departureFlightNumber: z.string().min(1, 'Departure flight number is required'),
  driverPickupTime: z.string().min(1, 'Driver pickup time is required'),
  notes: z.string().optional(),
});

interface VisitorFormProps {
  visitor?: Visitor;
  onSubmit: (data: VisitorFormData) => Promise<void>;
  isLoading?: boolean;
}

function formatDateForInput(date: Date | string | undefined): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

export function VisitorForm({ visitor, onSubmit, isLoading }: VisitorFormProps) {
  const [photos, setPhotos] = useState<VisitorPhoto[]>(visitor?.photos || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      name: visitor?.name || '',
      phone: visitor?.phone || '',
      arrivalDate: formatDateForInput(visitor?.arrivalDate),
      arrivalTime: visitor?.arrivalTime || '',
      airline: visitor?.airline || '',
      flightNumber: visitor?.flightNumber || '',
      driver: visitor?.driver || '',
      hotel: visitor?.hotel || '',
      departureDate: formatDateForInput(visitor?.departureDate),
      departureTime: visitor?.departureTime || '',
      departureAirline: visitor?.departureAirline || '',
      departureFlightNumber: visitor?.departureFlightNumber || '',
      driverPickupTime: visitor?.driverPickupTime || '',
      notes: visitor?.notes || '',
    },
  });

  const handleFormSubmit = async (data: VisitorFormData) => {
    await onSubmit({
      ...data,
      photos,
      groupId: visitor?.groupId,
      isGroupLeader: visitor?.isGroupLeader,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-blue-600 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name *" placeholder="Full name" error={errors.name?.message} {...register('name')} />
          <Input label="Phone *" placeholder="Phone number" type="tel" error={errors.phone?.message} {...register('phone')} />
        </div>
      </div>

      {/* Arrival Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-green-600 mb-4">Arrival Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Arrival Date *" type="date" error={errors.arrivalDate?.message} {...register('arrivalDate')} />
          <Input label="Arrival Time *" type="time" error={errors.arrivalTime?.message} {...register('arrivalTime')} />
          <Input label="Airline *" placeholder="e.g., Delta, United" error={errors.airline?.message} {...register('airline')} />
          <Input label="Flight Number *" placeholder="e.g., DL123" error={errors.flightNumber?.message} {...register('flightNumber')} />
          <Input label="Driver *" placeholder="Driver name" error={errors.driver?.message} {...register('driver')} className="sm:col-span-2" />
        </div>
      </div>

      {/* Accommodation */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-purple-600 mb-4">Accommodation</h3>
        <Input label="Hotel *" placeholder="Hotel name and address" error={errors.hotel?.message} {...register('hotel')} />
      </div>

      {/* Departure Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Departure Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Departure Date *" type="date" error={errors.departureDate?.message} {...register('departureDate')} />
          <Input label="Departure Time *" type="time" error={errors.departureTime?.message} {...register('departureTime')} />
          <Input label="Departure Airline *" placeholder="e.g., Delta, United" error={errors.departureAirline?.message} {...register('departureAirline')} />
          <Input label="Departure Flight Number *" placeholder="e.g., DL456" error={errors.departureFlightNumber?.message} {...register('departureFlightNumber')} />
          <Input label="Driver Pickup Time *" type="time" error={errors.driverPickupTime?.message} {...register('driverPickupTime')} className="sm:col-span-2" />
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-600 mb-4">Additional Notes</h3>
        <textarea
          placeholder="Any additional notes..."
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          {...register('notes')}
        />
      </div>

      {/* Photos */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-amber-600 mb-4">Photos</h3>
        <PhotoUpload
          photos={photos}
          onPhotosChange={setPhotos}
          maxPhotos={10}
          disabled={isLoading}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : visitor ? (
            'Update Visitor'
          ) : (
            'Add Visitor'
          )}
        </Button>
      </div>
    </form>
  );
}
