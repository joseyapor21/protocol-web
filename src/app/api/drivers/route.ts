import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

const DEPARTMENT_NAME = 'Protocol Department';

export async function GET() {
  try {
    const db = await getDatabase();

    // Find the Protocol Department
    const department = await db.collection('v5departments').findOne({ name: DEPARTMENT_NAME });

    if (!department) {
      return NextResponse.json(
        { status: 'error', message: 'Protocol Department not found' },
        { status: 404 }
      );
    }

    // Get all member IDs (both admins and regular members)
    const allMemberIds = [
      ...(department.adminIds || []),
      ...(department.memberIds || []),
    ];

    // Remove duplicates
    const uniqueMemberIds = [...new Set(allMemberIds)];

    if (uniqueMemberIds.length === 0) {
      return NextResponse.json({
        status: 'success',
        data: [],
      });
    }

    // Convert string IDs to ObjectIds for query
    const objectIds = uniqueMemberIds.map(id => {
      try {
        return new ObjectId(id);
      } catch {
        return id;
      }
    });

    // Fetch users from v5users collection
    const users = await db.collection('v5users')
      .find({
        _id: { $in: objectIds }
      })
      .project({ _id: 1, name: 1, email: 1 })
      .toArray();

    // Format the response
    const drivers = users.map(user => ({
      id: user._id.toString(),
      name: user.name || user.email,
      email: user.email,
    }));

    // Sort by name
    drivers.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      status: 'success',
      data: drivers,
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}
