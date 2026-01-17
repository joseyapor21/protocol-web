'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Visitor } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Share2,
  MapPin,
  Plane,
  Copy,
  Check,
  Image as ImageIcon,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface VisitorCardProps {
  visitor: Visitor;
  onDelete?: (id: string) => void;
}

export function VisitorCard({ visitor, onDelete }: VisitorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
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

  const handleOpenMaps = () => {
    const query = encodeURIComponent(visitor.hotel);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleCheckFlight = () => {
    const query = encodeURIComponent(`${visitor.airline} ${visitor.flightNumber} flight status`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  const handleCopyDetails = async () => {
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
    toast.success('Details copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${visitor.name}?`)) {
      onDelete?.(visitor._id as string);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{visitor.name}</h3>
              {visitor.groupId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                  <Users className="h-3 w-3" />
                  Group
                </span>
              )}
              {visitor.photos && visitor.photos.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                  <ImageIcon className="h-3 w-3" />
                  {visitor.photos.length}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
              <span>{formatDate(visitor.arrivalDate)}</span>
              <span className="hidden sm:inline">-</span>
              <span className="hidden sm:inline">{formatTime(visitor.arrivalTime)}</span>
              <span className="text-blue-600 font-medium">{visitor.hotel}</span>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
            {/* Contact Info */}
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{visitor.phone}</p>
            </div>

            {/* Arrival Info */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h4 className="font-medium text-green-700 mb-2 flex items-center gap-1">
                <Plane className="h-4 w-4" /> Arrival
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(visitor.arrivalDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Time</p>
                  <p className="font-medium">{formatTime(visitor.arrivalTime)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Flight</p>
                  <p className="font-medium">
                    {visitor.airline} {visitor.flightNumber}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Driver</p>
                  <p className="font-medium">{visitor.driver}</p>
                </div>
              </div>
            </div>

            {/* Hotel */}
            <div>
              <p className="text-sm text-gray-500">Hotel</p>
              <p className="font-medium">{visitor.hotel}</p>
            </div>

            {/* Departure Info */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h4 className="font-medium text-red-700 mb-2 flex items-center gap-1">
                <Plane className="h-4 w-4 rotate-45" /> Departure
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(visitor.departureDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Time</p>
                  <p className="font-medium">{formatTime(visitor.departureTime)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Flight</p>
                  <p className="font-medium">
                    {visitor.departureAirline} {visitor.departureFlightNumber}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Pickup Time</p>
                  <p className="font-medium">{formatTime(visitor.driverPickupTime)}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {visitor.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm">{visitor.notes}</p>
              </div>
            )}

            {/* Photos */}
            {visitor.photos && visitor.photos.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Photos</p>
                <div className="flex flex-wrap gap-2">
                  {visitor.photos.map((photo, index) => (
                    <a
                      key={photo.publicId || index}
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-16 h-16 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={photo.url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
              <Link href={`/visitors/${visitor._id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" /> Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenMaps}>
                <MapPin className="h-4 w-4 mr-1" /> Maps
              </Button>
              <Button variant="outline" size="sm" onClick={handleCheckFlight}>
                <Plane className="h-4 w-4 mr-1" /> Flight
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
        )}
      </CardContent>
    </Card>
  );
}
