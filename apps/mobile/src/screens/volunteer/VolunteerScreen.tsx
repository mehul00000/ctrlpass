import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { VolunteerStackParamList } from '../../navigation/types';

import VolunteerHomeScreen from './VolunteerHomeScreen';
import QRScannerScreen from './QRScannerScreen';
import ScanResultScreen from './ScanResultScreen';
import VolunteerProfileScreen from './VolunteerProfileScreen';

const Stack =
  createNativeStackNavigator<VolunteerStackParamList>();

export default function VolunteerScreen() {
  return (
    <Stack.Navigator
      id="VolunteerStack"
      initialRouteName="VolunteerHome"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#050505',
        },
        animation: 'slide_from_right',
        gestureEnabled: true,
        animationTypeForReplace: 'push',
      }}
    >
      {/* Main volunteer operations hub */}
      <Stack.Screen
        name="VolunteerHome"
        component={VolunteerHomeScreen}
      />

      {/* Gate scanning */}
      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />

      {/* Server-authoritative scan result */}
      <Stack.Screen
        name="ScanResult"
        component={ScanResultScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Volunteer account / assignments */}
      <Stack.Screen
        name="VolunteerProfile"
        component={VolunteerProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}