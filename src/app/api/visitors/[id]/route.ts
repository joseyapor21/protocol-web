import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const COLLECTION_NAME = 'v4protocol';

// Transform database format to frontend format
function transformVisitor(doc: Record<string, unknown>) {
  const formatTime = (timeObj: { hour?: number; minute?: number } | undefined) => {
    if (!timeObj || timeObj.hour === undefined) return '';
    const h = String(timeObj.hour).padStart(2, '0');
    const m = String(timeObj.minute || 0).padStart(2, '0');
    return `${h}:${m}`;
  };

  return {
    _id: doc._id,
    name: doc.name || '',
    phone: doc.phone || '',
    arrivalDate: doc.arrival_date || doc.arrivalDate || '',
    arrivalTime: formatTime(doc.arrival_hour as { hour?: number; minute?: number }) || doc.arrivalTime || '',
    airline: doc.airline || '',
    flightNumber: doc.flight_number || doc.flightNumber || '',
    driver: doc.driver || '',
    hotel: doc.hotel || '',
    departureDate: doc.departure_date || doc.departureDate || '',
    departureTime: formatTime(doc.departure_hour as { hour?: number; minute?: number }) || doc.departureTime || '',
    departureAirline: doc.departure_airline || doc.departureAirline || '',
    departureFlightNumber: doc.departure_flight_number || doc.departureFlightNumber || '',
    driverPickupTime: formatTime(doc.driver_pickup_time as { hour?: number; minute?: number }) || doc.driverPickupTime || '',
    notes: doc.notes || '',
    photos: doc.photos || [],
    groupId: doc.groupId || doc.group_id,
    isGroupLeader: doc.isGroupLeader || doc.is_group_leader,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// Transform frontend format to database format
function transformToDb(data: Record<string, unknown>) {
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: 0, minute: 0 };
    const [h, m] = timeStr.split(':').map(Number);
    return { hour: h || 0, minute: m || 0 };
  };

  return {
    name: data.name,
    phone: data.phone,
    arrival_date: data.arrivalDate ? new Date(data.arrivalDate as string) : new Date(),
    arrival_hour: parseTime(data.arrivalTime as string),
    airline: data.airline,
    flight_number: data.flightNumber,
    driver: data.driver,
    hotel: data.hotel,
    departure_date: data.departureDate ? new Date(data.departureDate as string) : new Date(),
    departure_hour: parseTime(data.departureTime as string),
    departure_airline: data.departureAirline,
    departure_flight_number: data.departureFlightNumber,
    driver_pickup_time: parseTime(data.driverPickupTime as string),
    notes: data.notes || '',
    photos: data.photos || [],
    groupId: data.groupId,
    isGroupLeader: data.isGroupLeader,
    updatedAt: new Date(),
  };
}

// GET - Get single visitor (all authenticated users can view)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid visitor ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const visitorsCollection = db.collection(COLLECTION_NAME);

    const visitor = await visitorsCollection.findOne({ _id: new ObjectId(id) });

    if (!visitor) {
      return NextResponse.json(
        { status: 'error', message: 'Visitor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: transformVisitor(visitor as Record<string, unknown>),
    });
  } catch (error) {
    console.error('Error fetching visitor:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch visitor' },
      { status: 500 }
    );
  }
}

// PUT - Update visitor (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    // Check if user is admin
    if (!user?.isAdmin && !user?.isSuperUser) {
      return NextResponse.json(
        { status: 'error', message: 'Only admins can edit visitors' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid visitor ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const visitorsCollection = db.collection(COLLECTION_NAME);

    const updateData = transformToDb(body);

    const result = await visitorsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { status: 'error', message: 'Visitor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: transformVisitor(result as Record<string, unknown>),
    });
  } catch (error) {
    console.error('Error updating visitor:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to update visitor' },
      { status: 500 }
    );
  }
}

// DELETE - Delete visitor (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    // Check if user is admin
    if (!user?.isAdmin && !user?.isSuperUser) {
      return NextResponse.json(
        { status: 'error', message: 'Only admins can delete visitors' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid visitor ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const visitorsCollection = db.collection(COLLECTION_NAME);

    const result = await visitorsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Visitor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Visitor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting visitor:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to delete visitor' },
      { status: 500 }
    );
  }
}
