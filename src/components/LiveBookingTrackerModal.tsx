import React from 'react';
import { TourBooking, User } from '../types';
import { Language } from '../lib/translations';
import { TourBookingHubModal } from './TourBookingHubModal';

interface LiveBookingTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: TourBooking[];
  selectedBooking?: TourBooking | null;
  currentUser: User | null;
  onUpdateStatus: (bookingId: string, status: any) => void;
  onConfirmCompletion?: (bookingId: string, role: 'traveler' | 'guide') => void;
  language?: Language;
}

export const LiveBookingTrackerModal: React.FC<LiveBookingTrackerModalProps> = ({
  isOpen,
  onClose,
  bookings,
  selectedBooking,
  currentUser,
  onUpdateStatus,
  onConfirmCompletion,
  language = 'en'
}) => {
  const activeRole = currentUser?.role === 'guide' ? 'guide' : currentUser?.role === 'traveler' ? 'traveler' : (typeof window !== 'undefined' && window.location.pathname.includes('/guide')) ? 'guide' : 'traveler';

  return (
    <TourBookingHubModal
      isOpen={isOpen}
      onClose={onClose}
      booking={selectedBooking || bookings[0] || null}
      allBookings={bookings}
      currentUser={currentUser}
      currentUserRole={activeRole}
      onUpdateStatus={onUpdateStatus}
      onConfirmCompletion={onConfirmCompletion}
      language={language}
    />
  );
};
