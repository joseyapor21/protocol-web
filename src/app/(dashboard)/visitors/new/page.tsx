'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VisitorFormData, VisitorPhoto } from '@/types';
import { ArrowLeft, Users, X, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { PhotoUpload } from '@/components/visitors/photo-upload';
import { CompanionForm, CompanionData } from '@/components/visitors/companion-form';

function generateGroupId(): string {
  return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

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

interface Companion {
  id: string;
  data: CompanionData;
  isValid: boolean;
}

export default function NewVisitorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [photos, setPhotos] = useState<VisitorPhoto[]>([]);
  const groupIdRef = useRef<string>(generateGroupId());

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      name: '',
      phone: '',
      arrivalDate: '',
      arrivalTime: '',
      airline: '',
      flightNumber: '',
      driver: '',
      hotel: '',
      departureDate: '',
      departureTime: '',
      departureAirline: '',
      departureFlightNumber: '',
      driverPickupTime: '',
      notes: '',
    },
  });

  const handleAddCompanion = useCallback(() => {
    const newCompanion: Companion = {
      id: `companion_${Date.now()}`,
      data: { name: '', phone: '', notes: '', photos: [] },
      isValid: false,
    };
    setCompanions((prev) => [...prev, newCompanion]);
    toast.success('Companion added. Fill in their personal details below.');
  }, []);

  const handleRemoveCompanion = useCallback((id: string) => {
    setCompanions((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleCompanionChange = useCallback((id: string, data: CompanionData, isValid: boolean) => {
    setCompanions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, data, isValid } : c))
    );
  }, []);

  const handleFormSubmit = async (primaryData: VisitorFormData) => {
    // Validate companions
    const invalidCompanions = companions.filter((c) => !c.isValid);
    if (invalidCompanions.length > 0) {
      toast.error('Please fill in all required fields for companions (name and phone)');
      return;
    }

    setIsLoading(true);

    try {
      const hasCompanions = companions.length > 0;
      const groupId = hasCompanions ? groupIdRef.current : undefined;

      // Create primary visitor
      const primaryVisitor = {
        ...primaryData,
        photos,
        groupId,
        isGroupLeader: hasCompanions ? true : undefined,
      };

      const primaryResponse = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(primaryVisitor),
      });

      const primaryResult = await primaryResponse.json();

      if (primaryResult.status !== 'success') {
        toast.error(primaryResult.message || 'Failed to add primary visitor');
        setIsLoading(false);
        return;
      }

      // Create companions with shared travel details
      if (hasCompanions) {
        const companionPromises = companions.map((companion) => {
          const companionVisitor = {
            // Shared travel details from primary visitor
            arrivalDate: primaryData.arrivalDate,
            arrivalTime: primaryData.arrivalTime,
            airline: primaryData.airline,
            flightNumber: primaryData.flightNumber,
            driver: primaryData.driver,
            hotel: primaryData.hotel,
            departureDate: primaryData.departureDate,
            departureTime: primaryData.departureTime,
            departureAirline: primaryData.departureAirline,
            departureFlightNumber: primaryData.departureFlightNumber,
            driverPickupTime: primaryData.driverPickupTime,
            // Personal details from companion form
            name: companion.data.name,
            phone: companion.data.phone,
            notes: companion.data.notes,
            photos: companion.data.photos,
            // Group info
            groupId,
            isGroupLeader: false,
          };

          return fetch('/api/visitors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(companionVisitor),
          }).then((r) => r.json());
        });

        const results = await Promise.all(companionPromises);
        const failed = results.filter((r) => r.status !== 'success');

        if (failed.length > 0) {
          toast.error(`${failed.length} companion(s) failed to save`);
        }
      }

      const totalAdded = 1 + companions.length;
      toast.success(
        hasCompanions
          ? `Group of ${totalAdded} visitors added successfully!`
          : 'Visitor added successfully!'
      );
      router.push('/dashboard');
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const isGroup = companions.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isGroup ? 'Add Group of Visitors' : 'Add New Visitor'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isGroup
            ? 'Fill in the shared travel details and individual information'
            : 'Fill in the visitor details below'}
        </p>
        {isGroup && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            <Users className="h-4 w-4" />
            Group: {companions.length + 1} travelers
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Primary Visitor Personal Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">
            {isGroup ? 'Primary Visitor - Personal Information' : 'Personal Information'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Name *" placeholder="Full name" error={errors.name?.message} {...register('name')} />
            <Input label="Phone *" placeholder="Phone number" type="tel" error={errors.phone?.message} {...register('phone')} />
          </div>
        </div>

        {/* Shared Travel Details Section */}
        <div className={isGroup ? 'bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-1' : ''}>
          {isGroup && (
            <div className="bg-purple-100 rounded-t-lg px-4 py-2 mb-1">
              <p className="text-purple-800 text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Shared Travel Details (applies to all group members)
              </p>
            </div>
          )}

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
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mt-4">
            <h3 className="text-lg font-semibold text-purple-600 mb-4">Accommodation</h3>
            <Input label="Hotel *" placeholder="Hotel name and address" error={errors.hotel?.message} {...register('hotel')} />
          </div>

          {/* Departure Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mt-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Departure Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Departure Date *" type="date" error={errors.departureDate?.message} {...register('departureDate')} />
              <Input label="Departure Time *" type="time" error={errors.departureTime?.message} {...register('departureTime')} />
              <Input label="Departure Airline *" placeholder="e.g., Delta, United" error={errors.departureAirline?.message} {...register('departureAirline')} />
              <Input label="Departure Flight Number *" placeholder="e.g., DL456" error={errors.departureFlightNumber?.message} {...register('departureFlightNumber')} />
              <Input label="Driver Pickup Time *" type="time" error={errors.driverPickupTime?.message} {...register('driverPickupTime')} className="sm:col-span-2" />
            </div>
          </div>
        </div>

        {/* Primary Visitor Notes & Photos */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-4">
            {isGroup ? 'Primary Visitor - Notes' : 'Additional Notes'}
          </h3>
          <textarea
            placeholder="Any additional notes..."
            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            {...register('notes')}
          />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-amber-600 mb-4">
            {isGroup ? 'Primary Visitor - Photos' : 'Photos'}
          </h3>
          <PhotoUpload
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={10}
            disabled={isLoading}
          />
        </div>

        {/* Companions Section */}
        {companions.length > 0 && (
          <div className="border-t-2 border-purple-200 pt-6">
            <h2 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Companions
            </h2>
            <div className="space-y-6">
              {companions.map((companion, index) => (
                <div key={companion.id} className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCompanion(companion.id)}
                    className="absolute -top-2 right-0 text-red-500 hover:text-red-700 hover:bg-red-50 z-10"
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                  <CompanionForm
                    index={index}
                    defaultValues={companion.data}
                    onChange={(data, isValid) => handleCompanionChange(companion.id, data, isValid)}
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Companion & Submit Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCompanion}
            disabled={isLoading}
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Companion
          </Button>

          <Button
            type="submit"
            disabled={isLoading}
            className={isGroup ? 'bg-purple-600 hover:bg-purple-700' : ''}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isGroup ? (
              <>
                <Users className="mr-2 h-4 w-4" />
                Save Group ({companions.length + 1} visitors)
              </>
            ) : (
              'Add Visitor'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
