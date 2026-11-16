import { NavigatorScreenParams } from '@react-navigation/native';
import { CheckInResult } from '../types';

export type AttendeeTabKey = 'Home' | 'Explore' | 'Tickets' | 'Bookings' | 'Profile';

export type AttendeeStackParamList = {
  AttendeeTabs: { tab?: AttendeeTabKey } | undefined;
  EventDetails: { eventId: string };
  TicketSelection: { eventId: string };
  AttendeeDetails: { eventId: string; ticketTypeId: string; quantity: number };
  OrderSummary: {
    eventId: string;
    ticketTypeId: string;
    quantity: number;
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone: string;
    extraFields?: Record<string, string>;
  };
  BookingStatus: { bookingId: string };
  TicketDetail: { ticketId: string };
  Notifications: undefined;
  Referrals: undefined;
  ChangePassword: undefined;
  ChangeEmail: undefined;
  DeleteAccount: undefined;
  NotificationSettings: undefined;
  PrivacyCenter: undefined;
  Info: { doc: 'terms' | 'privacy' | 'about' | 'help' };
};

export type VolunteerStackParamList = {
  VolunteerHome: undefined;
  QRScanner: { eventId: string };
  ScanResult: { eventId: string; result: CheckInResult };
  VolunteerProfile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  ProfileSetup: undefined;
  Consent: undefined;
  AccountStatus: { reason: string };
  Attendee: NavigatorScreenParams<AttendeeStackParamList>;
  Volunteer: NavigatorScreenParams<VolunteerStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
