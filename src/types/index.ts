import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId | string;
  email: string;
  password: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VisitorPhoto {
  url: string;
  publicId: string;
  uploadedAt: Date | string;
}

export interface Visitor {
  _id?: ObjectId | string;
  name: string;
  phone: string;
  arrivalDate: Date | string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  driver: string;
  hotel: string;
  departureDate: Date | string;
  departureTime: string;
  departureAirline: string;
  departureFlightNumber: string;
  driverPickupTime: string;
  notes?: string;
  photos?: VisitorPhoto[];
  groupId?: string;
  isGroupLeader?: boolean;
  createdBy?: ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VisitorFormData {
  name: string;
  phone: string;
  arrivalDate: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  driver: string;
  hotel: string;
  departureDate: string;
  departureTime: string;
  departureAirline: string;
  departureFlightNumber: string;
  driverPickupTime: string;
  notes?: string;
  photos?: VisitorPhoto[];
  groupId?: string;
  isGroupLeader?: boolean;
}

export interface AuthResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  };
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface WeekGroup {
  weekStart: Date;
  weekEnd: Date;
  visitors: Visitor[];
}
