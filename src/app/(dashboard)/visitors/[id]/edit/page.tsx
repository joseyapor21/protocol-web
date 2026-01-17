'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Visitor, VisitorFormData, VisitorPhoto } from '@/types';
import { ArrowLeft, Loader2, Users, UserPlus, X, Unlink, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { PhotoUpload } from '@/components/visitors/photo-upload';
import { CompanionForm, CompanionData } from '@/components/visitors/companion-form';
import { format, parseISO } from 'date-fns';

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

function formatDateForInput(date: Date | string | undefined): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

interface NewCompanion {
  id: string;
  data: CompanionData;
  isValid: boolean;
}

export default function EditVisitorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [groupMembers, setGroupMembers] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<VisitorPhoto[]>([]);
  const [newCompanions, setNewCompanions] = useState<NewCompanion[]>([]);
  const groupIdRef = useRef<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
  });

  useEffect(() => {
    const fetchVisitor = async () => {
      try {
        const response = await fetch(`/api/visitors/${id}`);
        const data = await response.json();

        if (data.status === 'success') {
          const v = data.data as Visitor;
          setVisitor(v);
          setPhotos(v.photos || []);
          groupIdRef.current = v.groupId || generateGroupId();

          reset({
            name: v.name || '',
            phone: v.phone || '',
            arrivalDate: formatDateForInput(v.arrivalDate),
            arrivalTime: v.arrivalTime || '',
            airline: v.airline || '',
            flightNumber: v.flightNumber || '',
            driver: v.driver || '',
            hotel: v.hotel || '',
            departureDate: formatDateForInput(v.departureDate),
            departureTime: v.departureTime || '',
            departureAirline: v.departureAirline || '',
            departureFlightNumber: v.departureFlightNumber || '',
            driverPickupTime: v.driverPickupTime || '',
            notes: v.notes || '',
          });

          // Fetch group members if part of a group
          if (v.groupId) {
            const allResponse = await fetch('/api/visitors');
            const allData = await allResponse.json();
            if (allData.status === 'success') {
              const members = (allData.data as Visitor[]).filter(
                (m) => m.groupId === v.groupId && m._id !== v._id
              );
              setGroupMembers(members);
            }
          }
        } else {
          toast.error('Visitor not found');
          router.push('/dashboard');
        }
      } catch {
        toast.error('Error loading visitor');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisitor();
  }, [id, router, reset]);

  const handleAddNewCompanion = useCallback(() => {
    const companion: NewCompanion = {
      id: `new_companion_${Date.now()}`,
      data: { name: '', phone: '', notes: '', photos: [] },
      isValid: false,
    };
    setNewCompanions((prev) => [...prev, companion]);
  }, []);

  const handleRemoveNewCompanion = useCallback((companionId: string) => {
    setNewCompanions((prev) => prev.filter((c) => c.id !== companionId));
  }, []);

  const handleNewCompanionChange = useCallback(
    (companionId: string, data: CompanionData, isValid: boolean) => {
      setNewCompanions((prev) =>
        prev.map((c) => (c.id === companionId ? { ...c, data, isValid } : c))
      );
    },
    []
  );

  const handleRemoveFromGroup = async () => {
    if (!visitor) return;

    const confirmed = window.confirm(
      'Are you sure you want to remove this visitor from the group? They will become an individual visitor.'
    );
    if (!confirmed) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/visitors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...visitor,
          groupId: null,
          isGroupLeader: null,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Removed from group');
        setVisitor((prev) => (prev ? { ...prev, groupId: undefined, isGroupLeader: undefined } : null));
        setGroupMembers([]);
      } else {
        toast.error('Failed to remove from group');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormSubmit = async (data: VisitorFormData) => {
    if (!visitor) return;

    // Validate new companions
    const invalidCompanions = newCompanions.filter((c) => !c.isValid);
    if (invalidCompanions.length > 0) {
      toast.error('Please fill in all required fields for new companions (name and phone)');
      return;
    }

    setIsSaving(true);

    try {
      // Determine if we need to create/update group
      const hasNewCompanions = newCompanions.length > 0;
      const existingGroupId = visitor.groupId;
      const groupId = hasNewCompanions ? groupIdRef.current : existingGroupId;

      // Update current visitor
      const visitorData = {
        ...data,
        photos,
        groupId: hasNewCompanions || existingGroupId ? groupId : undefined,
        isGroupLeader:
          hasNewCompanions && !existingGroupId ? true : visitor.isGroupLeader,
      };

      const response = await fetch(`/api/visitors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitorData),
      });

      const result = await response.json();

      if (result.status !== 'success') {
        toast.error(result.message || 'Failed to update visitor');
        setIsSaving(false);
        return;
      }

      // Create new companions with shared travel details
      if (hasNewCompanions) {
        const companionPromises = newCompanions.map((companion) => {
          const companionVisitor = {
            // Shared travel details from current visitor
            arrivalDate: data.arrivalDate,
            arrivalTime: data.arrivalTime,
            airline: data.airline,
            flightNumber: data.flightNumber,
            driver: data.driver,
            hotel: data.hotel,
            departureDate: data.departureDate,
            departureTime: data.departureTime,
            departureAirline: data.departureAirline,
            departureFlightNumber: data.departureFlightNumber,
            driverPickupTime: data.driverPickupTime,
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

      const message = hasNewCompanions
        ? `Visitor updated and ${newCompanions.length} companion(s) added!`
        : 'Visitor updated successfully';
      toast.success(message);
      router.push('/dashboard');
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!visitor) {
    return null;
  }

  const isInGroup = !!visitor.groupId;
  const totalGroupSize = groupMembers.length + 1 + newCompanions.length;

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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Visitor</h1>
        <p className="text-gray-500 mt-1">Update visitor details for {visitor.name}</p>
        {(isInGroup || newCompanions.length > 0) && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            <Users className="h-4 w-4" />
            Group: {totalGroupSize} travelers
            {visitor.isGroupLeader && (
              <span className="text-xs bg-purple-200 px-2 py-0.5 rounded-full">Leader</span>
            )}
          </div>
        )}
      </div>

      {/* Existing Group Members */}
      {isInGroup && groupMembers.length > 0 && (
        <div className="mb-6 bg-purple-50 rounded-lg border border-purple-200 p-4">
          <h3 className="text-md font-semibold text-purple-800 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Other Group Members
          </h3>
          <div className="space-y-2">
            {groupMembers.map((member) => (
              <Link
                key={String(member._id)}
                href={`/visitors/${member._id}/edit`}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-100 hover:border-purple-300 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.phone}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            ))}
          </div>
          {visitor.isGroupLeader && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveFromGroup}
              disabled={isSaving}
              className="mt-3 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Unlink className="h-4 w-4 mr-1" />
              Remove from Group
            </Button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Name *" placeholder="Full name" error={errors.name?.message} {...register('name')} />
            <Input label="Phone *" placeholder="Phone number" type="tel" error={errors.phone?.message} {...register('phone')} />
          </div>
        </div>

        {/* Travel Details */}
        <div className={isInGroup || newCompanions.length > 0 ? 'bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-1' : ''}>
          {(isInGroup || newCompanions.length > 0) && (
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
            disabled={isSaving}
          />
        </div>

        {/* New Companions Section */}
        {newCompanions.length > 0 && (
          <div className="border-t-2 border-purple-200 pt-6">
            <h2 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              New Companions
            </h2>
            <div className="space-y-6">
              {newCompanions.map((companion, index) => (
                <div key={companion.id} className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveNewCompanion(companion.id)}
                    className="absolute -top-2 right-0 text-red-500 hover:text-red-700 hover:bg-red-50 z-10"
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                  <CompanionForm
                    index={groupMembers.length + index}
                    defaultValues={companion.data}
                    onChange={(data, isValid) => handleNewCompanionChange(companion.id, data, isValid)}
                    disabled={isSaving}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddNewCompanion}
            disabled={isSaving}
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Companion
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
            className={newCompanions.length > 0 ? 'bg-purple-600 hover:bg-purple-700' : ''}
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : newCompanions.length > 0 ? (
              <>
                <Users className="mr-2 h-4 w-4" />
                Update & Add {newCompanions.length} Companion(s)
              </>
            ) : (
              'Update Visitor'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
