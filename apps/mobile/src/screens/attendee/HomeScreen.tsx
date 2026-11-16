import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { TextReveal } from '../../components/text-animation';
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger } from '../../components/menu';
import { AnimatedNumber } from '../../components/number';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AttendeeStackParamList } from '../../navigation/types';
import { eventService } from '../../services/events';
import { useAuth } from '../../hooks/useAuth';
import { Event } from '../../types';

import { ErrorState, LoadingSkeleton } from '../../components';

import {
  GlassSearchBar,
  GoldGlow,
  SectionHeader,
  FeaturedEventCard,
  EventCard,
  CategoryPill,
} from '../../components/cinema';

import { colors, spacing, typography } from '../../theme';

const CATEGORIES = [
  'All',
  'Music',
  'Tech',
  'Nightlife',
  'Culture',
  'Sports',
  'Business',
];

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AttendeeStackParamList>>();

  const { profile } = useAuth();

  const [featured, setFeatured] = useState<Event[]>([]);
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Event[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const cityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...featured, ...upcoming]
            .map(event => event.venue?.city)
            .filter(Boolean) as string[],
        ),
      ).sort(),
    [featured, upcoming],
  );

  const visibleFeatured = useMemo(
    () =>
      selectedCity
        ? featured.filter(
            event => event.venue?.city === selectedCity,
          )
        : featured,
    [featured, selectedCity],
  );

  const visibleUpcoming = useMemo(
    () =>
      selectedCity
        ? upcoming.filter(
            event => event.venue?.city === selectedCity,
          )
        : upcoming,
    [upcoming, selectedCity],
  );

  const loadData = async () => {
    try {
      setError(null);

      const [featuredEvents, upcomingEvents] = await Promise.all([
        eventService.listFeatured(),
        eventService.listPublished({ limit: 10 }),
      ]);

      setFeatured(featuredEvents);
      setUpcoming(upcomingEvents);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load events',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);

      try {
        const results = await eventService.listPublished({
          search: searchQuery.trim(),
          limit: 20,
        });

        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (loading) {
    return <LoadingSkeleton label="CtrlPass" />;
  }

  if (error && featured.length === 0 && upcoming.length === 0) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  const openEvent = (eventId: string) => {
    navigation.navigate('EventDetails', {
      eventId,
    });
  };

  const goExplore = () => {
    navigation.navigate('AttendeeTabs', {
      tab: 'Explore',
    });
  };

  const refresh = () => {
    setRefreshing(true);
    loadData();
  };

  const showingSearch = searchResults !== null;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.champagne}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {/* ---------------------------------------------------------
            ATMOSPHERE
        --------------------------------------------------------- */}

        <GoldGlow
          size={380}
          style={styles.topGlow}
        />

        <GoldGlow
          size={240}
          style={styles.secondaryGlow}
        />

        {/* ---------------------------------------------------------
            HEADER
        --------------------------------------------------------- */}

        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>
              {getGreeting()}
            </Text>

            <TextReveal
              text={
                firstName
                  ? [
                      'Find something',
                      `worth remembering, ${firstName}.`,
                    ]
                  : ['Find something', 'worth remembering.']
              }
              className="text-[32px] text-[#F2EADD] leading-[38px] font-bold tracking-[-1.2px]"
            />
          </View>

          <Menu>
            <MenuTrigger
              accessibilityLabel="Choose city"
              style={styles.locationRow}
            >
              <View style={styles.locationDot} />

              <Text style={styles.locationText}>
                {selectedCity ?? 'All cities'}
              </Text>
            </MenuTrigger>

            <MenuContent>
              <MenuRadioGroup
                value={selectedCity ?? ''}
                onValueChange={value =>
                  setSelectedCity(value || null)
                }
              >
                <MenuRadioItem value="">
                  All cities
                </MenuRadioItem>

                {cityOptions.map(city => (
                  <MenuRadioItem key={city} value={city}>
                    {city}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuContent>
          </Menu>
        </View>

        {/* ---------------------------------------------------------
            SEARCH
        --------------------------------------------------------- */}

        <View style={styles.searchContainer}>
          <GlassSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
            onFilter={goExplore}
          />
        </View>

        {/* ---------------------------------------------------------
            CATEGORIES
        --------------------------------------------------------- */}

        {!showingSearch && (
          <View style={styles.categorySection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContent}
            >
              {CATEGORIES.map(category => (
                <CategoryPill
                  key={category}
                  label={category}
                  active={category === 'All'}
                  onPress={goExplore}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ---------------------------------------------------------
            SEARCH RESULTS
        --------------------------------------------------------- */}

        {showingSearch ? (
          <View style={styles.searchResults}>
            <View style={styles.searchHeading}>
              <View>
                <Text style={styles.searchTitle}>
                  {searching
                    ? 'Finding events…'
                    : (
                        <>
                          <AnimatedNumber
                            value={searchResults.length}
                          />
                          {' '}
                          {searchResults.length === 1
                            ? 'event'
                            : 'events'}
                          {' found'}
                        </>
                      )}
                </Text>
              </View>
            </View>

            {searchResults.length === 0 && !searching ? (
              <View style={styles.emptySearch}>
                <Text style={styles.emptyTitle}>
                  Nothing matched
                </Text>

                <Text style={styles.emptyDescription}>
                  Try another event, artist, venue or city.
                </Text>
              </View>
            ) : (
              <View style={styles.resultList}>
                {searchResults.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => openEvent(event.id)}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* -----------------------------------------------------
                FEATURED
            ----------------------------------------------------- */}

            {featured.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Featured events"
                  eyebrow="CURATED FOR YOU"
                  actionLabel="See all"
                  onAction={goExplore}
                />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredContent}
                  decelerationRate="fast"
                >
                  {visibleFeatured.map(event => (
                    <FeaturedEventCard
                      key={event.id}
                      event={event}
                      onPress={() => openEvent(event.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* -----------------------------------------------------
                UPCOMING
            ----------------------------------------------------- */}

            <View style={styles.section}>
              <SectionHeader
                title="Upcoming near you"
                eyebrow="DISCOVER"
                actionLabel="Explore"
                onAction={goExplore}
              />

              {upcoming.length === 0 ? (
                <View style={styles.emptyEvents}>
                  <View style={styles.emptyAccent} />

                  <Text style={styles.emptyEventsTitle}>
                    Nothing here yet
                  </Text>

                  <Text style={styles.emptyEventsDescription}>
                    New experiences are coming soon.
                    Try another category or explore
                    all events.
                  </Text>

                  <Text
                    style={styles.emptyAction}
                    onPress={goExplore}
                  >
                    Explore all events
                  </Text>
                </View>
              ) : (
                <View style={styles.eventList}>
                  {visibleUpcoming.slice(0, 6).map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onPress={() => openEvent(event.id)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* -----------------------------------------------------
                BOTTOM ATMOSPHERIC SPACE
            ----------------------------------------------------- */}

            <View style={styles.endSpace}>
              <View style={styles.endLine} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },

  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },

  content: {
    paddingTop: spacing.sm,
    paddingBottom: 150,
  },

  /* -------------------------------------------------------------
     ATMOSPHERE
  ------------------------------------------------------------- */

  topGlow: {
    position: 'absolute',
    top: -180,
    right: -110,
    opacity: 0.65,
  },

  secondaryGlow: {
    position: 'absolute',
    top: 360,
    left: -180,
    opacity: 0.18,
  },

  /* -------------------------------------------------------------
     HEADER
  ------------------------------------------------------------- */

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },

  headerCopy: {
    maxWidth: 360,
  },

  eyebrow: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -1.2,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },

  locationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.champagne,
    marginRight: spacing.xs,
  },

  locationText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
  },

  /* -------------------------------------------------------------
     SEARCH
  ------------------------------------------------------------- */

  searchContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  /* -------------------------------------------------------------
     CATEGORIES
  ------------------------------------------------------------- */

  categorySection: {
    marginBottom: spacing.xl,
  },

  categoryContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },

  /* -------------------------------------------------------------
     SEARCH RESULTS
  ------------------------------------------------------------- */

  searchResults: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  searchHeading: {
    marginBottom: spacing.lg,
  },

  searchTitle: {
    color: colors.textPrimary,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.5,
  },

  resultList: {
    gap: spacing.md,
  },

  emptySearch: {
    minHeight: 260,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },

  emptyDescription: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

  /* -------------------------------------------------------------
     SECTIONS
  ------------------------------------------------------------- */

  section: {
    marginBottom: 34,
  },

  featuredContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  eventList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  /* -------------------------------------------------------------
     EMPTY STATE
  ------------------------------------------------------------- */

  emptyEvents: {
    marginHorizontal: spacing.lg,
    minHeight: 230,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },

  emptyAccent: {
    position: 'absolute',
    top: 0,
    width: 70,
    height: 2,
    backgroundColor: colors.champagne,
    opacity: 0.8,
  },

  emptyEventsTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.4,
    marginBottom: spacing.xs,
  },

  emptyEventsDescription: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 290,
  },

  emptyAction: {
    color: colors.champagne,
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.md,
  },

  /* -------------------------------------------------------------
     FOOTER
  ------------------------------------------------------------- */

  endSpace: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  endLine: {
    width: 38,
    height: 1,
    backgroundColor: 'rgba(214,180,122,0.35)',
    marginBottom: spacing.sm,
  },

});
