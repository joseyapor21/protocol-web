'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Visitor } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Share2,
  MapPin,
  Plane,
  Copy,
  Check,
  Phone,
  Calendar,
  Hotel,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function VisitorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchVisitor = async () => {
      try {
        const response = await fetch(`/api/visitors/${id}`);
        const data = await response.json();

        if (data.status === 'success') {
          setVisitor(data.data);
        } else {
          toast.error('Visitor not found');
          router.push('/dashboard');
        }
      } catch {
        toast.error('Error loading visitor');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisitor();
  }, [id, router]);

  const handleShare = async () => {
    if (!visitor) return;
    try {
      const response = await fetch('/api/drivers/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: visitor._id }),
      });
      const data = await response.json();

      if (data.status === 'success') {
        if (navigator.share) {
          await navigator.share({
            title: `Driver Schedule: ${visitor.name}`,
            text: `Pickup for ${visitor.name} on ${formatDate(visitor.arrivalDate)}`,
            url: data.data.link,
          });
        } else {
          await navigator.clipboard.writeText(data.data.link);
          toast.success('Link copied to clipboard');
        }
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyDetails = async () => {
    if (!visitor) return;
    const details = `
Visitor: ${visitor.name}
Phone: ${visitor.phone}

ARRIVAL
Date: ${formatDate(visitor.arrivalDate)}
Time: ${formatTime(visitor.arrivalTime)}
Flight: ${visitor.airline} ${visitor.flightNumber}
Driver: ${visitor.driver}

HOTEL
${visitor.hotel}

DEPARTURE
Date: ${formatDate(visitor.departureDate)}
Time: ${formatTime(visitor.departureTime)}
Flight: ${visitor.departureAirline} ${visitor.departureFlightNumber}
Pickup: ${formatTime(visitor.driverPickupTime)}
${visitor.notes ? `\nNotes: ${visitor.notes}` : ''}
    `.trim();

    await navigator.clipboard.writeText(details);
    setCopied(true);
    toast.success('Details copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!visitor || !confirm(`Delete ${visitor.name}?`)) return;

    try {
      const response = await fetch(`/api/visitors/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.status === 'success') {
        toast.success('Visitor deleted');
        router.push('/dashboard');
      } else {
        toast.error('Failed to delete visitor');
      }
    } catch {
      toast.error('Error deleting visitor');
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
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold">Visitor not found</h2>
        <Link href="/dashboard">
          <Button className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{visitor.name}</h1>
          <p className="text-gray-500 flex items-center gap-2 mt-1">
            <Phone className="h-4 w-4" />
            {visitor.phone}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/visitors/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyDetails}>
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            Copy
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Arrival Card */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center gap-2">
              <Plane className="h-5 w-5" /> Arrival
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">
                    {formatDate(visitor.arrivalDate)} at {formatTime(visitor.arrivalTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Plane className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Flight</p>
                  <p className="font-medium">
                    {visitor.airline} {visitor.flightNumber}
                  </p>
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500">Driver</p>
                <p className="font-medium">{visitor.driver}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hotel Card */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-purple-600 mb-4 flex items-center gap-2">
              <Hotel className="h-5 w-5" /> Accommodation
            </h3>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{visitor.hotel}</p>
                <button
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visitor.hotel)}`, '_blank')}
                  className="text-sm text-blue-600 hover:underline mt-1"
                >
                  Open in Google Maps
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departure Card */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
              <Plane className="h-5 w-5 rotate-45" /> Departure
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">
                    {formatDate(visitor.departureDate)} at {formatTime(visitor.departureTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Plane className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Flight</p>
                  <p className="font-medium">
                    {visitor.departureAirline} {visitor.departureFlightNumber}
                  </p>
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500">Driver Pickup Time</p>
                <p className="font-medium">{formatTime(visitor.driverPickupTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes Card */}
        {visitor.notes && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{visitor.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
