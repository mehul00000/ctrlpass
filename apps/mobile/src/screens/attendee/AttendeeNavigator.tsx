import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AttendeeStackParamList } from '../../navigation/types';

import AttendeeScreen from './AttendeeScreen';
import EventDetailsScreen from './EventDetailsScreen';
import TicketSelectionScreen from './TicketSelectionScreen';
import AttendeeDetailsScreen from './AttendeeDetailsScreen';
import OrderSummaryScreen from './OrderSummaryScreen';
import BookingStatusScreen from './BookingStatusScreen';
import TicketDetailScreen from './TicketDetailScreen';
import NotificationsScreen from './NotificationsScreen';

import ReferralsScreen from '../account/ReferralsScreen';
import ChangePasswordScreen from '../account/ChangePasswordScreen';
import ChangeEmailScreen from '../account/ChangeEmailScreen';
import DeleteAccountScreen from '../account/DeleteAccountScreen';
import NotificationSettingsScreen from '../account/NotificationSettingsScreen';
import PrivacyCenterScreen from '../account/PrivacyCenterScreen';
import InfoScreen from '../account/InfoScreen';

const Stack =
  createNativeStackNavigator<AttendeeStackParamList>();

export default function AttendeeNavigator() {
  return (
    <Stack.Navigator
      id="AttendeeStack"
      initialRouteName="AttendeeTabs"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        contentStyle: {
          backgroundColor: '#050505',
        },
      }}
    >
      {/* Main attendee experience */}

      <Stack.Screen
        name="AttendeeTabs"
        component={AttendeeScreen}
      />

      {/* Discovery / event */}

      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
      />

      {/* Booking flow */}

      <Stack.Screen
        name="TicketSelection"
        component={TicketSelectionScreen}
      />

      <Stack.Screen
        name="AttendeeDetails"
        component={AttendeeDetailsScreen}
      />

      <Stack.Screen
        name="OrderSummary"
        component={OrderSummaryScreen}
      />

      <Stack.Screen
        name="BookingStatus"
        component={BookingStatusScreen}
      />

      {/* Ticket */}

      <Stack.Screen
        name="TicketDetail"
        component={TicketDetailScreen}
      />

      {/* Notifications */}

      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />

      {/* Account */}

      <Stack.Screen
        name="Referrals"
        component={ReferralsScreen}
      />

      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
      />

      <Stack.Screen
        name="ChangeEmail"
        component={ChangeEmailScreen}
      />

      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
      />

      <Stack.Screen
        name="PrivacyCenter"
        component={PrivacyCenterScreen}
      />

      <Stack.Screen
        name="Info"
        component={InfoScreen}
      />

      {/* Destructive account action */}

      <Stack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
      />
    </Stack.Navigator>
  );
}