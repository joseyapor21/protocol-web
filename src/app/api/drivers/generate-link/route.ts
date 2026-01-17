import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/db';

const COLLECTION_NAME = 'v4protocol';

export async function POST(request: NextRequest) {
  try {
    const { visitorId } = await request.json();

    if (!visitorId || !ObjectId.isValid(visitorId)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid visitor ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const visitorsCollection = db.collection(COLLECTION_NAME);

    const visitor = await visitorsCollection.findOne({ _id: new ObjectId(visitorId) });

    if (!visitor) {
      return NextResponse.json(
        { status: 'error', message: 'Visitor not found' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const driverLink = `${baseUrl}/driver/${visitorId}`;

    // Format time from object
    const formatTime = (timeObj: { hour?: number; minute?: number } | undefined) => {
      if (!timeObj || timeObj.hour === undefined) return '';
      const h = String(timeObj.hour).padStart(2, '0');
      const m = String(timeObj.minute || 0).padStart(2, '0');
      return `${h}:${m}`;
    };

    return NextResponse.json({
      status: 'success',
      data: {
        link: driverLink,
        visitor: {
          name: visitor.name,
          arrivalDate: visitor.arrival_date || visitor.arrivalDate,
          arrivalTime: formatTime(visitor.arrival_hour) || visitor.arrivalTime,
          hotel: visitor.hotel,
          driver: visitor.driver,
        },
      },
    });
  } catch (error) {
    console.error('Error generating driver link:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to generate driver link' },
      { status: 500 }
    );
  }
}
