import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  RefreshControl,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import { RangeSlider } from '../../components/range-slider';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AttendeeStackParamList } from '../../navigation/types';
import { eventService } from '../../services/events';
import { Event } from '../../types';
import { ErrorState, LoadingSkeleton } from '../../components';
import {
  EventCard,
  FeaturedEventCard,
  CategoryPill,
  GlassSearchBar,
  SectionHeader,
} from '../../components/cinema';
import { TicketIcon } from '../../components/icons';
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

type Navigation = NativeStackNavigationProp<AttendeeStackParamList>;

function ExploreEmptyState({
  onClear,
  hasFilters,
}: {
  onClear: () => void;
  hasFilters: boolean;
}) {
  return (
    <View style={s.emptyContainer}>
      <View style={s.emptyOrb} />

      <View style={s.emptyIcon}>
        <TicketIcon
          color={colors.champagne}
          size={25}
          strokeWidth={1.4}
        />
      </View>

      <Text style={s.emptyTitle}>
        Nothing here yet
      </Text>

      <Text style={s.emptyDescription}>
        {hasFilters
          ? 'Try another category or search for something different.'
          : 'New experiences are added by organizers every day.'}
      </Text>

      {hasFilters ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Clear filters"
          style={({ pressed }) => [
            s.clearButton,
            pressed && s.pressed,
          ]}
        >
          <Text style={s.clearButtonText}>
            Clear filters
          </Text>
        </Pressable>
      ) : (
        <Text style={s.emptyHint}>
          Check back soon for new events.
        </Text>
      )}
    </View>
  );
}

function ExploreHeader({
  search,
  setSearch,
  handleSearch,
  clearSearch,
  selectedCategories,
  toggleCategory,
  maxPrice,
  setMaxPrice,
  priceCeiling,
}: {
  search: string;
  setSearch: (value: string) => void;
  handleSearch: () => void;
  clearSearch: () => void;
  selectedCategories: string[];
  toggleCategory: (value: string) => void;
  maxPrice: number | null;
  setMaxPrice: (value: number | null) => void;
  priceCeiling: number;
}) {
  return (
    <View style={s.header}>
      <View style={s.headerIntro}>
        <View>
          <Text style={s.headerEyebrow}>
            EXPLORE
          </Text>

          <Text style={s.headerTitle}>
            Find your next{'\n'}
            <Text style={s.headerAccent}>
              experience.
            </Text>
          </Text>
        </View>
      </View>

      <View style={s.searchContainer}>
        <GlassSearchBar
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          onClear={clearSearch}
          placeholder="Search events, venues, cities"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.categoryRow}
        keyboardShouldPersistTaps="handled"
      >
        {CATEGORIES.map(item => (
          <CategoryPill
            key={item}
            label={item}
            active={
              item === 'All'
                ? selectedCategories.length === 0
                : selectedCategories.includes(item)
            }
            onPress={() => toggleCategory(item)}
          />
        ))}
      </ScrollView>

      {priceCeiling > 0 ? (
        <View style={s.priceFilter}>
          <Text style={s.priceFilterLabel}>
            {maxPrice === null
              ? 'Any price'
              : `Up to ₹${maxPrice}`}
          </Text>

          <RangeSlider
            value={maxPrice ?? Math.ceil(priceCeiling / 100)}
            onValueChange={value => setMaxPrice(value)}
            min={0}
            max={Math.ceil(priceCeiling / 100)}
            step={50}
          />
        </View>
      ) : null}
    </View>
  );
}

function EventCount({
  count,
}: {
  count: number;
}) {
  return (
    <View style={s.countPill}>
      <Text style={s.countNumber}>
        {count}
      </Text>
      <Text style={s.countLabel}>
        {count === 1 ? 'EVENT' : 'EVENTS'}
      </Text>
    </View>
  );
}

function MiniEventCard({
  event,
  onPress,
  width,
}: {
  event: Event;
  onPress: () => void;
  width: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${event.name}`}
      style={({ pressed }) => [
        {
          width,
        },
        s.miniCard,
        pressed && s.cardPressed,
      ]}
    >
      <View style={s.miniImageWrap}>
        {event.cover_image_url ? (
          <Image
            source={{ uri: event.cover_image_url }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={s.miniImageFallback}>
            <Text style={s.miniFallbackText}>
              CP
            </Text>
          </View>
        )}

        <View style={s.miniImageShade} />

        <View style={s.miniCategory}>
          <Text style={s.miniCategoryText}>
            {event.category}
          </Text>
        </View>
      </View>

      <View style={s.miniContent}>
        <Text
          style={s.miniTitle}
          numberOfLines={2}
        >
          {event.name}
        </Text>

        {event.venue?.city ? (
          <Text
            style={s.miniLocation}
            numberOfLines={1}
          >
            {event.venue.city}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);

      const data =
        await eventService.listPublished();

      setEvents(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load events',
      );
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // initial load; search/category/price narrow client-side
  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      fetchEvents();
    }, 120);

    return () => clearTimeout(timer);
  }, [fetchEvents]);

  const toggleCategory = useCallback((value: string) => {
    setSelectedCategories(current =>
      value === 'All'
        ? []
        : current.includes(value)
          ? current.filter(c => c !== value)
          : [...current, value],
    );
  }, []);

  const handleSearch = useCallback(() => {
    setLoading(true);
    fetchEvents();
  }, [fetchEvents]);

  const clearSearch = useCallback(() => {
    setSearch('');
    setSelectedCategories([]);
    setMaxPrice(null);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setMaxPrice(null);
    setSearch('');
  }, []);

  const hasFilters =
    selectedCategories.length > 0 ||
    maxPrice !== null ||
    search.trim().length > 0;

  const priceCeiling = useMemo(() => {
    let highest = 0;
    for (const event of events) {
      for (const tier of event.ticket_types ?? []) {
        if (tier.price_minor > highest) {
          highest = tier.price_minor;
        }
      }
    }
    return highest;
  }, [events]);

  const visibleEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter(event => {
      const matchesCategory =
        selectedCategories.length === 0 ||
        (event.category
          ? selectedCategories.includes(event.category)
          : false);

      const lowestPrice = (event.ticket_types ?? [])
        .filter(tier => tier.price_minor > 0)
        .reduce<number | null>(
          (lowest, tier) =>
            lowest === null || tier.price_minor < lowest
              ? tier.price_minor
              : lowest,
          null,
        );

      const matchesPrice =
        maxPrice === null ||
        lowestPrice === null ||
        lowestPrice <= maxPrice * 100;

      const matchesSearch =
        !query ||
        event.name?.toLowerCase().includes(query) ||
        event.venue?.city?.toLowerCase().includes(query) ||
        event.venue?.name?.toLowerCase().includes(query);

      return matchesCategory && matchesPrice && matchesSearch;
    });
  }, [events, selectedCategories, maxPrice, search]);

  const featuredEvent = visibleEvents[0];
  const remainingEvents = visibleEvents.slice(1);

  const miniCardWidth = useMemo(() => {
    return Math.min(
      250,
      Math.max(210, width * 0.68),
    );
  }, [width]);

  if (loading) {
    return <LoadingSkeleton label="Explore" />;
  }

  return (
    <View style={s.container}>
      <SafeAreaView
        edges={['top']}
        style={s.safeArea}
      >
        <ExploreHeader
          search={search}
          setSearch={setSearch}
          handleSearch={handleSearch}
          clearSearch={clearSearch}
          selectedCategories={selectedCategories}
          toggleCategory={toggleCategory}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          priceCeiling={priceCeiling}
        />

        {error ? (
          <View style={s.errorContainer}>
            <ErrorState
              message={error}
              onRetry={fetchEvents}
            />
          </View>
        ) : visibleEvents.length === 0 ? (
          <ExploreEmptyState
            onClear={clearFilters}
            hasFilters={hasFilters}
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchEvents();
                }}
                tintColor={colors.champagne}
                progressBackgroundColor="#111111"
              />
            }
            contentContainerStyle={[
              s.content,
              {
                paddingBottom:
                  145 + insets.bottom,
              },
            ]}
            bounces
            overScrollMode="never"
          >
            {/* ---------------------------------------------------
                RESULT SUMMARY
            --------------------------------------------------- */}

            <View style={s.resultHeader}>
              <View>
                <Text style={s.resultEyebrow}>
                  {selectedCategories.length === 1
                    ? `${selectedCategories[0].toUpperCase()} EVENTS`
                    : 'CURATED FOR YOU'}
                </Text>

                <Text style={s.resultTitle}>
                  Worth stepping out for.
                </Text>
              </View>

              <EventCount count={visibleEvents.length} />
            </View>

            {/* ---------------------------------------------------
                FEATURED EVENT
            --------------------------------------------------- */}

            <View style={s.featuredSection}>
              <FeaturedEventCard
                event={featuredEvent}
                onPress={() =>
                  navigation.navigate(
                    'EventDetails',
                    {
                      eventId:
                        featuredEvent.id,
                    },
                  )
                }
              />
            </View>

            {/* ---------------------------------------------------
                UPCOMING HORIZONTAL RAIL
            --------------------------------------------------- */}

            {remainingEvents.length > 0 ? (
              <View style={s.railSection}>
                <SectionHeader
                  title="More to explore"
                  eyebrow="UPCOMING"
                />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={
                    s.railContent
                  }
                  decelerationRate="fast"
                  snapToInterval={
                    miniCardWidth + 14
                  }
                  snapToAlignment="start"
                >
                  {remainingEvents.map(event => (
                    <MiniEventCard
                      key={event.id}
                      event={event}
                      width={miniCardWidth}
                      onPress={() =>
                        navigation.navigate(
                          'EventDetails',
                          {
                            eventId: event.id,
                          },
                        )
                      }
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* ---------------------------------------------------
                FULL LIST
            --------------------------------------------------- */}

            {remainingEvents.length > 2 ? (
              <View style={s.listSection}>
                <SectionHeader
                  title="All events"
                  eyebrow="DISCOVER"
                />

                {remainingEvents
                  .slice(2)
                  .map(event => (
                    <EventCard
                      key={`list-${event.id}`}
                      event={event}
                      onPress={() =>
                        navigation.navigate(
                          'EventDetails',
                          {
                            eventId: event.id,
                          },
                        )
                      }
                    />
                  ))}
              </View>
            ) : null}

            <View style={s.footerMark}>
              <View style={s.footerLine} />

              <Text style={s.footerText}>
                CTRL PASS
              </Text>

              <View style={s.footerLine} />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  priceFilter: {
    paddingHorizontal: 20,
    marginTop: 14,
  },

  priceFilterLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },

  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },

  safeArea: {
    flex: 1,
  },

  /* ---------------------------------------------------------------
     HEADER
  --------------------------------------------------------------- */

  header: {
    paddingTop: spacing.sm,
  },

  headerIntro: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },


  headerEyebrow: {
    color: colors.goldSoft,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 8,
  },


  headerTitle: {
    color: colors.textPrimary,
    fontSize: 31,
    lineHeight: 35,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -1,
  },

  headerAccent: {
    color: colors.champagne,
  },

  searchContainer: {
    paddingHorizontal: spacing.lg,
  },

  categoryRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingRight: spacing.xl,
    gap: 8,
  },

  /* ---------------------------------------------------------------
     CONTENT
  --------------------------------------------------------------- */

  content: {
    paddingHorizontal: spacing.lg,
  },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    gap: spacing.md,
  },


  resultEyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 5,
  },


  resultTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.45,
  },

  countPill: {
    minWidth: 54,
    height: 42,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#141414',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  countNumber: {
    color: colors.champagne,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: typography.fontWeight.bold,
  },


  countLabel: {
    color: '#68645E',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginTop: 1,
  },

  /* ---------------------------------------------------------------
     FEATURED
  --------------------------------------------------------------- */

  featuredSection: {
    marginBottom: 30,
  },

  /* ---------------------------------------------------------------
     HORIZONTAL RAIL
  --------------------------------------------------------------- */

  railSection: {
    marginHorizontal: -spacing.lg,
    marginBottom: 30,
  },

  railContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    gap: 14,
  },

  miniCard: {
    backgroundColor: '#141414',
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  miniImageWrap: {
    height: 150,
    backgroundColor: '#0E0E0E',
    overflow: 'hidden',
  },

  miniImageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D0D',
  },


  miniFallbackText: {
    color: 'rgba(214,180,122,0.35)',
    fontSize: 30,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -1,
  },

  miniImageShade: {
    ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    backgroundColor: 'rgba(0,0,0,0.16)',
  },

  miniCategory: {
    position: 'absolute',
    top: 11,
    left: 11,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(5,5,5,0.68)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },


  miniCategoryText: {
    color: '#F0ECE4',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },

  miniContent: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  miniTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: typography.fontWeight.semibold,
  },

  miniLocation: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
  },

  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  /* ---------------------------------------------------------------
     FULL LIST
  --------------------------------------------------------------- */

  listSection: {
    marginBottom: 20,
  },

  /* ---------------------------------------------------------------
     EMPTY STATE
  --------------------------------------------------------------- */

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 72,
    overflow: 'hidden',
  },

  emptyOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(214,180,122,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.055)',
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(214,180,122,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.14)',
  },


  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.5,
    marginTop: spacing.lg,
  },

  emptyDescription: {
    maxWidth: 320,
    color: '#85817A',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  clearButton: {
    marginTop: spacing.xl,
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(214,180,122,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.25)',
  },

  clearButtonText: {
    color: colors.champagne,
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
  },


  emptyHint: {
    color: '#5F5B55',
    fontSize: 11,
        marginTop: spacing.xl,
  },

  pressed: {
    opacity: 0.7,
  },

  /* ---------------------------------------------------------------
     ERROR
  --------------------------------------------------------------- */

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  /* ---------------------------------------------------------------
     FOOTER
  --------------------------------------------------------------- */

  footerMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    marginBottom: 8,
  },

  footerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },


  footerText: {
    color: '#4F4C47',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
});
