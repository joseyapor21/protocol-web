import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin || false,
        isSuperUser: user.isSuperUser || false,
      },
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to get user info' },
      { status: 500 }
    );
  }
}
