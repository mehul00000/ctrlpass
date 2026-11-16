import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import {
  RouteProp,
  useRoute,
} from '@react-navigation/native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  FloatingBottomNav,
  NavItem,
} from '../../components/cinema';
import {
  CompassIcon,
  HomeIcon,
  ReceiptIcon,
  TicketIcon,
  UserIcon,
} from '../../components/icons';

import {
  AttendeeStackParamList,
  AttendeeTabKey,
} from '../../navigation/types';

import HomeScreen from './HomeScreen';
import ExploreScreen from './ExploreScreen';
import TicketsScreen from './TicketsScreen';
import BookingsScreen from './BookingsScreen';
import ProfileScreen from './ProfileScreen';

const TABS: NavItem[] = [
  {
    key: 'Home',
    label: 'Home',
    Icon: HomeIcon,
  },
  {
    key: 'Explore',
    label: 'Explore',
    Icon: CompassIcon,
  },
  {
    key: 'Tickets',
    label: 'Tickets',
    Icon: TicketIcon,
  },
  {
    key: 'Bookings',
    label: 'Bookings',
    Icon: ReceiptIcon,
  },
  {
    key: 'Profile',
    label: 'Profile',
    Icon: UserIcon,
  },
];

export default function AttendeeScreen() {
  const route =
    useRoute<
      RouteProp<
        AttendeeStackParamList,
        'AttendeeTabs'
      >
    >();

  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] =
    useState<AttendeeTabKey>(
      route.params?.tab ?? 'Home',
    );

  useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route.params?.tab]);

  function renderActiveScreen() {
    switch (activeTab) {
      case 'Explore':
        return <ExploreScreen />;

      case 'Tickets':
        return <TicketsScreen />;

      case 'Bookings':
        return <BookingsScreen />;

      case 'Profile':
        return <ProfileScreen />;

      case 'Home':
      default:
        return <HomeScreen />;
    }
  }

  function handleTabChange(key: string) {
    setActiveTab(key as AttendeeTabKey);
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <View
        style={[
          styles.content,
          {
            paddingBottom:
              82 +
              Math.max(insets.bottom, 10),
          },
        ]}
      >
        {renderActiveScreen()}
      </View>

      <View
        pointerEvents="box-none"
        style={[
          styles.navigationLayer,
          {
            paddingBottom:
              Math.max(insets.bottom, 8),
          },
        ]}
      >
        <FloatingBottomNav
          items={TABS}
          active={activeTab}
          onChange={handleTabChange}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    flex: 1,
    backgroundColor: '#050505',
  },

  navigationLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});