import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { createHash, createHmac, pbkdf2Sync } from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'protocol-department-secret-key-change-in-production';
const DEPARTMENT_NAME = 'Protocol Department';

function verifyPassword(storedPassword: string, providedPassword: string): boolean {
  // Handle old sha256$salt$hash format (uses HMAC-SHA256)
  if (storedPassword.startsWith('sha256$')) {
    try {
      const parts = storedPassword.split('$');
      if (parts.length === 3) {
        const [, salt, storedHash] = parts;
        const testHash = createHmac('sha256', salt).update(providedPassword).digest('hex');
        if (testHash === storedHash) {
          return true;
        }
      }
    } catch {
      // Continue to other methods
    }
  }

  // Handle pbkdf2:sha256 format
  if (storedPassword.startsWith('pbkdf2:sha256')) {
    try {
      const parts = storedPassword.split('$');
      if (parts.length === 3) {
        const [method, salt, storedHash] = parts;
        const iterations = parseInt(method.split(':')[2] || '150000');
        const testHash = pbkdf2Sync(providedPassword, salt, iterations, 32, 'sha256').toString('hex');
        if (testHash === storedHash) {
          return true;
        }
      }
    } catch {
      // Continue to other methods
    }
  }

  // Plain text comparison (fallback)
  if (storedPassword === providedPassword) {
    return true;
  }

  // Simple SHA256 hash comparison
  const hashedProvided = createHash('sha256').update(providedPassword).digest('hex');
  if (storedPassword === hashedProvided) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { status: 'error', message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const normalizedEmail = email.toLowerCase().trim();

    // Use v5users collection (same as admin system)
    const user = await db.collection('v5users').findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!verifyPassword(user.password, password)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const userId = user._id.toString();

    // Check if user is SuperUser (they can access everything)
    const isSuperUser = user.isSuperUser || false;

    // Find the Protocol Department
    const department = await db.collection('v5departments').findOne({ name: DEPARTMENT_NAME });

    if (!department && !isSuperUser) {
      return NextResponse.json(
        { status: 'error', message: 'Protocol Department not configured' },
        { status: 500 }
      );
    }

    // Check if user is in the department (as admin or member) or is a SuperUser
    const isInDepartment = isSuperUser ||
      (department?.adminIds || []).includes(userId) ||
      (department?.memberIds || []).includes(userId);

    if (!isInDepartment) {
      return NextResponse.json(
        { status: 'error', message: 'Access denied. You are not a member of the Protocol Department.' },
        { status: 403 }
      );
    }

    // Check if user is a department admin
    const isDeptAdmin = isSuperUser || (department?.adminIds || []).includes(userId);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId,
        email: user.email,
        name: user.name || '',
        isAdmin: isDeptAdmin,
        isSuperUser,
      },
      JWT_SECRET,
      { expiresIn: '365d' }
    );

    const response = NextResponse.json({
      status: 'success',
      data: {
        token,
        user: {
          id: userId,
          email: user.email,
          name: user.name || '',
          isAdmin: isDeptAdmin,
          isSuperUser,
        },
      },
    });

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
