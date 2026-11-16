/**
 * CtrlPass "Cinema Noir" component system.
 * Deep black canvas, charcoal glass surfaces, champagne/gold accents.
 * Blur is simulated with translucency (no native blur dependency) so
 * Android degrades gracefully; readability beats effects.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import {
  SearchIcon,
  SlidersIcon,
} from './icons';
import { Event, eventIsFree } from '../types';
import { formatDate, formatPaiseCompact } from '../lib/utils';
import { QrCode } from './QrCode';

/* ── shared helpers ───────────────────────────────────────────────── */

const cardShadow: ViewStyle = {
  shadowColor: '#000',
  shadowOpacity: 0.45,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
};

const goldShadow: ViewStyle = {
  shadowColor: colors.champagne,
  shadowOpacity: 0.35,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 5,
};

function pressScale(pressed: boolean): StyleProp<ViewStyle> {
  return { transform: [{ scale: pressed ? 0.97 : 1 }], opacity: pressed ? 0.9 : 1 };
}

/** Cinematic fade from image to the black canvas — sliced bands fake a gradient. */
export function Scrim({ height = 0.62, bands = 10 }: { height?: number; bands?: number }) {
  return (
    <View style={[st.absoluteFill, { justifyContent: 'flex-end' }]} pointerEvents="none">
      <View style={{ height: `${height * 100}%` } as ViewStyle}>
        {Array.from({ length: bands }, (_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              backgroundColor: colors.ink,
              opacity: Math.pow((i + 1) / bands, 1.6) * 0.96,
            }}
          />
        ))}
      </View>
    </View>
  );
}

/** Soft champagne atmospheric glow — nested translucent rings, no gradient lib. */
export function GoldGlow({ size = 260, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {[1, 0.72, 0.46, 0.24].map((f, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: size * f,
            height: size * f,
            borderRadius: (size * f) / 2,
            backgroundColor: colors.champagne,
            opacity: 0.045,
          }}
        />
      ))}
    </View>
  );
}

function EyebrowText({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[st.eyebrow, style]} numberOfLines={1}>
      {children}
    </Text>
  );
}

/** Public eyebrow label — small champagne uppercase line above titles. */
export function Eyebrow({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <EyebrowText style={style}>{children}</EyebrowText>;
}

/* ── 1. GlassCard ─────────────────────────────────────────────────── */

export function GlassCard({
  children,
  style,
  padded = true,
  glow = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  glow?: boolean;
}) {
  return (
    <View style={[st.glassCard, padded && st.glassCardPad, glow && goldShadow, style]}>{children}</View>
  );
}

/* ── 2. GlassSearchBar ────────────────────────────────────────────── */

export function GlassSearchBar({
  value,
  onChangeText,
  placeholder = 'Search events',
  onClear,
  onFilter,
  filterLabel,
  ...inputProps
}: TextInputProps & {
  value: string;
  onChangeText: (t: string) => void;
  onClear?: () => void;
  onFilter?: () => void;
  filterLabel?: string;
}) {
  return (
    <View style={st.searchBar}>
      <View style={st.searchIconWrap}>
        <SearchIcon color={colors.mutedText} size={17} />
      </View>
      <TextInput
        style={st.searchInput}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        {...inputProps}
      />
      {value.length > 0 && onClear ? (
        <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
          <Text style={st.searchClear}>✕</Text>
        </Pressable>
      ) : null}
      {onFilter ? (
        <Pressable
          onPress={onFilter}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={filterLabel ?? 'Filters'}
          style={({ pressed }) => [st.searchFilter, pressed && { opacity: 0.7 }]}
        >
          <SlidersIcon color={colors.textPrimary} size={15} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ── 3/4/5. Buttons ───────────────────────────────────────────────── */

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      style={({ pressed }) => [st.primaryBtn, (!inactive && !pressed) && goldShadow, inactive && st.btnDisabled, pressScale(pressed), style]}
    >
      <Text style={st.primaryBtnText}>{loading ? 'Please wait…' : title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [st.secondaryBtn, disabled && st.btnDisabled, pressScale(pressed), style]}
    >
      <Text style={st.secondaryBtnText}>{title}</Text>
    </Pressable>
  );
}

/** GlassButton — translucent glass pill, alias style of Secondary. */
export const GlassButton = SecondaryButton;

/* ── 6. IconButton ────────────────────────────────────────────────── */

export function IconButton({
  icon,
  onPress,
  label,
  size = 40,
  style,
}: {
  icon: React.ReactNode;
  onPress?: () => void;
  label: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        st.iconBtn,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
}

/* ── 7. EmptyCard ─────────────────────────────────────────────────── */

export function EmptyCard({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={[st.glassCard, st.emptyCard]}>
      <Text style={st.emptyTitle}>{title}</Text>
      {description ? <Text style={st.emptyDescription}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [st.emptyAction, pressed && { opacity: 0.7 }]}
        >
          <Text style={st.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ── 8/9. Event cards ─────────────────────────────────────────────── */

function cheapestVisible(e: Event) {
  return (
    e.ticket_types
      ?.filter(t => t.visibility === 'VISIBLE' && t.status === 'ACTIVE')
      .sort((a, b) => a.price_minor - b.price_minor)[0] ?? undefined
  );
}

export function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const venue = event.venue;
  const cheapest = cheapestVisible(event);
  const isFree = eventIsFree(event);
  const price = isFree ? 'FREE' : cheapest ? `From ${formatPaiseCompact(cheapest.price_minor)}` : '—';

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={event.name} style={({ pressed }) => [pressScale(pressed), st.eventCardWrap]}>
      <View style={st.eventCard}>
        <View style={st.eventImageBox}>
          {event.cover_image_url ? (
            <Image source={{ uri: event.cover_image_url }} style={st.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[st.absoluteFill, st.imageFallback]}>
              <Text style={st.imageFallbackGlyph}>✦</Text>
            </View>
          )}
          <Scrim height={0.72} />
          <View style={st.eventImageOverlay}>
            <View style={st.badgeRow}>
              {event.status === 'CANCELLED' ? (
                <View style={[st.miniBadge, st.miniBadgeError]}>
                  <Text style={[st.miniBadgeText, { color: colors.error }]}>CANCELLED</Text>
                </View>
              ) : (
                <View style={st.miniBadge}>
                  <Text style={st.miniBadgeText}>{event.category}</Text>
                </View>
              )}
              <View style={st.miniBadge}>
                <Text style={[st.miniBadgeText, { color: colors.champagne }]}>{price}</Text>
              </View>
            </View>
            <Text style={st.eventTitle} numberOfLines={2}>
              {event.name}
            </Text>
            <Text style={st.eventMeta} numberOfLines={1}>
              {[
                formatDate(event.start_at),
                venue?.name ? `${venue.name}${venue.city ? `, ${venue.city}` : ''}` : venue?.city,
              ]
                .filter(Boolean)
                .join('  ·  ')}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function FeaturedEventCard({
  event,
  onPress,
  width,
  height = 460,
}: {
  event: Event;
  onPress: () => void;
  /** omit width for full-bleed inside a padded parent */
  width?: number;
  height?: number;
}) {
  const venue = event.venue;
  const cheapest = cheapestVisible(event);
  const isFree = eventIsFree(event);
  const price = isFree ? 'FREE' : cheapest ? `From ${formatPaiseCompact(cheapest.price_minor)}` : null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={event.name}
      style={({ pressed }) => [{ width, height }, pressScale(pressed), st.featuredWrap]}
    >
      <View style={st.featuredInner}>
        <View style={StyleSheet.absoluteFill}>
          {event.cover_image_url ? (
            <Image source={{ uri: event.cover_image_url }} style={st.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[st.absoluteFill, st.imageFallback]}>
              <Text style={st.imageFallbackGlyph}>✦</Text>
            </View>
          )}
          {/* image occupies the full card; text sits over the bottom fade */}
          <Scrim height={0.75} bands={14} />
        </View>
        <View style={[st.featuredOverlay]}>
          <View style={st.badgeRow}>
            <View style={[st.miniBadge, st.miniBadgeGold]}>
              <Text style={[st.miniBadgeText, { color: colors.champagne }]}>FEATURED</Text>
            </View>
          </View>
          <View>
            <EyebrowText style={{ color: colors.champagne }}>
              {event.category}
              {venue?.city ? `  ·  ${venue.city}` : ''}
            </EyebrowText>
            <Text style={st.featuredTitle} numberOfLines={2}>
              {event.name}
            </Text>
            <Text style={st.eventMeta} numberOfLines={1}>
              {formatDate(event.start_at)}
              {venue?.name ? `  ·  ${venue.name}` : ''}
            </Text>
            {price ? (
              <Text style={[st.eventMeta, { color: colors.champagne, fontWeight: typography.fontWeight.semibold, marginTop: 3 }]}>
                {price}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* ── 10. CategoryPill ─────────────────────────────────────────────── */

export function CategoryPill({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [st.pill, active && st.pillActive, pressed && { opacity: 0.75 }]}
    >
      <Text style={[st.pillText, active && st.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

/* ── 11. SectionHeader ────────────────────────────────────────────── */

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  eyebrow,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  eyebrow?: string;
}) {
  return (
    <View style={st.sectionHeader}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <EyebrowText>{eyebrow}</EyebrowText> : null}
        <Text style={st.sectionTitle}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={st.sectionAction}>{actionLabel} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ── 13. StatusBadge ──────────────────────────────────────────────── */

type BadgeTone = 'gold' | 'success' | 'warning' | 'error' | 'neutral';

const badgeTones: Record<BadgeTone, { bg: string; border: string; fg: string }> = {
  gold: { bg: colors.goldSoft, border: colors.goldBorder, fg: colors.champagne },
  success: { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.4)', fg: colors.success },
  warning: { bg: 'rgba(229,183,103,0.12)', border: 'rgba(229,183,103,0.4)', fg: colors.warning },
  error: { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.4)', fg: colors.error },
  neutral: { bg: colors.glass, border: colors.glassBorder, fg: colors.mutedText },
};

export function StatusBadge({ label, tone = 'gold' }: { label: string; tone?: BadgeTone }) {
  const t = badgeTones[tone];
  return (
    <View style={[st.statusBadge, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[st.statusBadgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

/* ── 12. QuantitySelector ─────────────────────────────────────────── */

export function QuantitySelector({
  value,
  min = 1,
  max,
  onChange,
  onLimit,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (v: number) => void;
  onLimit?: () => void;
}) {
  const dec = () => (value > min ? onChange(value - 1) : undefined);
  const inc = () => (value < max ? onChange(value + 1) : onLimit?.());
  return (
    <View style={st.qtySelector}>
      <Pressable onPress={dec} hitSlop={4} disabled={value <= min} accessibilityRole="button" accessibilityLabel="Decrease quantity" style={st.qtyBtn}>
        <Text style={[st.qtyGlyph, value <= min && { opacity: 0.3 }]}>−</Text>
      </Pressable>
      <Text style={st.qtyValue}>{value}</Text>
      <Pressable onPress={inc} hitSlop={4} accessibilityRole="button" accessibilityLabel="Increase quantity" style={st.qtyBtn}>
        <Text style={st.qtyGlyph}>＋</Text>
      </Pressable>
    </View>
  );
}

/* ── 14. TicketCard ───────────────────────────────────────────────── */

export function TicketCard({
  eventName,
  dateText,
  tierName,
  reference,
  qrValue,
  statusLabel,
  statusTone = 'gold',
  onPress,
}: {
  eventName: string;
  dateText: string;
  tierName: string;
  reference: string;
  qrValue: string;
  statusLabel: string;
  statusTone?: BadgeTone;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Ticket for ${eventName}`} style={({ pressed }) => [pressScale(pressed), { marginBottom: spacing.md }]}>
      <View style={[st.glassCard, { overflow: 'hidden' }]}>
        <View style={{ padding: spacing.lg }}>
          <View style={st.ticketHeadRow}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <EyebrowText>{tierName}</EyebrowText>
              <Text style={st.ticketEventName} numberOfLines={1}>
                {eventName}
              </Text>
              <Text style={st.ticketDate} numberOfLines={1}>
                {dateText}
              </Text>
            </View>
            <StatusBadge label={statusLabel} tone={statusTone} />
          </View>
        </View>

        {/* perforation */}
        <View style={st.perfRow}>
          <View style={[st.perfNotch, { marginLeft: -9 }]} />
          <View style={st.perfDash} />
          <View style={[st.perfNotch, { marginRight: -9 }]} />
        </View>

        <View style={[st.ticketStub, { padding: spacing.lg }]}>
          <View style={{ flex: 1 }}>
            <Text style={st.ticketRefLabel}>REFERENCE</Text>
            <Text style={st.ticketRef} numberOfLines={1}>
              {reference}
            </Text>
            <Text style={st.ticketHint}>Tap to present full pass  ›</Text>
          </View>
          <View style={st.qrMini}>
            <QrCode value={qrValue} size={68} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* ── 15. TicketQR ─────────────────────────────────────────────────── */

export function TicketQR({ value, size = 208 }: { value: string; size?: number }) {
  return (
    <View style={st.qrFrame}>
      <View style={st.qrWhite}>
        <QrCode value={value} size={size} />
      </View>
      <Text style={[st.eyebrow, { color: colors.champagne, marginTop: spacing.md }]}>PRESENT AT GATE</Text>
    </View>
  );
}

/* ── 16. FloatingBottomNav ────────────────────────────────────────── */

export interface NavItem {
  key: string;
  label: string;
  Icon: React.ComponentType<{ color?: string; size?: number }>;
}

export function FloatingBottomNav({
  items,
  active,
  onChange,
}: {
  items: NavItem[];
  active: string;
  onChange: (key: string) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[st.navFloat, { bottom: Math.max(insets.bottom, 10) }]}>
      <View style={st.navPill}>
        {items.map(item => {
          const isActive = item.key === active;
          return (
            <Pressable
              key={item.key}
              onPress={() => onChange(item.key)}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [st.navItem, pressed && { opacity: 0.7 }]}
            >
              <View style={[st.navIconWrap, isActive && st.navIconWrapActive]}>
                <item.Icon color={isActive ? colors.champagne : colors.textMuted} size={17} />
              </View>
              <Text style={[st.navLabel, isActive && st.navLabelActive]} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ── 17. LoadingSkeleton ──────────────────────────────────────────── */

export function LoadingSkeleton({ label }: { label?: string }) {
  const pulse = useRef(new Animated.Value(0.35)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduceMotion).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  const Block = ({ w = '100%', h = 16, r = 6, mb = 10, style }: { w?: number | `${number}%`; h?: number; r?: number; mb?: number; style?: StyleProp<ViewStyle> }) => (
    <Animated.View
      style={[{ width: w, height: h, borderRadius: r, backgroundColor: colors.glassStrong, marginBottom: mb, opacity: pulse }, style]}
    />
  );

  return (
    <View style={{ flex: 1, padding: spacing.lg }}>
      {label ? <Text style={[st.eyebrow, { marginBottom: spacing.md }]}>{label}</Text> : null}
      <Block w="55%" h={26} r={8} mb={18} />
      <Block h={50} r={25} mb={18} />
      <Block h={200} r={20} mb={18} />
      <Block h={130} r={20} mb={18} />
      <Block h={130} r={20} />
    </View>
  );
}

/* ── 18. GlassBottomSheet ─────────────────────────────────────────── */

export function GlassBottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={st.sheetBackdrop} onPress={onClose} accessibilityLabel="Close">
        <Pressable style={[st.sheetPanel, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]} onPress={() => undefined}>
          <View style={st.sheetGrabber} />
          <Text style={st.sheetTitle}>{title}</Text>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── styles ───────────────────────────────────────────────────────── */

const st = StyleSheet.create({
  absoluteFill: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 },

  eyebrow: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
  },

  // GlassCard
  glassCard: {
    backgroundColor: colors.glass,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    ...cardShadow,
  },
  glassCardPad: { padding: spacing.lg },

  // Search — compact premium nav control, not a form field
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchIconWrap: { justifyContent: 'center', alignItems: 'center' },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchClear: { color: colors.mutedText, fontSize: 13 },
  searchFilter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Buttons
  primaryBtn: {
    backgroundColor: colors.champagne,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: spacing.xl,
  },
  primaryBtnText: {
    color: colors.onAccent,
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.medium,
  },
  btnDisabled: { opacity: 0.4 },

  // IconButton
  iconBtn: {
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // EmptyCard
  emptyCard: { alignItems: 'center', padding: spacing.xl, marginHorizontal: spacing.lg },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.cardHeading,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    color: colors.mutedText,
    fontSize: typography.fontSize.bodySm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emptyAction: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  emptyActionText: { color: colors.champagne, fontSize: typography.fontSize.bodySm, fontWeight: typography.fontWeight.semibold },

  // Event cards — image-first, solid surface, not glass
  eventCardWrap: { marginBottom: spacing.md },
  featuredWrap: { marginBottom: spacing.md },
  featuredInner: { flex: 1, overflow: 'hidden', borderRadius: 22, backgroundColor: colors.elevated },
  eventCard: { overflow: 'hidden', borderRadius: 20, backgroundColor: colors.elevated, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  eventImageBox: { height: 230 },
  imageFallback: { backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center' },
  imageFallbackGlyph: { color: colors.champagne, fontSize: 30, opacity: 0.5 },
  eventImageOverlay: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  miniBadge: {
    backgroundColor: 'rgba(5,5,5,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  miniBadgeGold: { borderColor: colors.goldBorder, backgroundColor: 'rgba(5,5,5,0.55)' },
  miniBadgeError: { borderColor: 'rgba(248,113,113,0.4)' },
  miniBadgeText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.8,
  },
  eventTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.3,
  },
  eventMeta: {
    color: colors.mutedText,
    fontSize: 12,
    marginTop: 5,
    letterSpacing: 0.2,
  },
  featuredTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.5,
    marginTop: 5,
    marginBottom: 4,
  },
  featuredOverlay: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: spacing.md,
    bottom: spacing.lg,
    justifyContent: 'space-between',
  },

  // Pills — refined chips
  pill: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  pillActive: {
    backgroundColor: colors.goldSoft,
    borderColor: colors.goldBorder,
  },
  pillText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
  },
  pillTextActive: { color: colors.champagne, fontWeight: typography.fontWeight.semibold },

  // SectionHeader
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  sectionAction: {
    color: colors.champagne,
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.medium,
  },

  // StatusBadge
  statusBadge: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },

  // Quantity
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5,5,5,0.5)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    borderRadius: 999,
  },
  qtyBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  qtyGlyph: { color: colors.textPrimary, fontSize: 18 },
  qtyValue: {
    color: colors.champagne,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    minWidth: 30,
    textAlign: 'center',
  },

  // TicketCard
  ticketHeadRow: { flexDirection: 'row', alignItems: 'flex-start' },
  ticketEventName: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.3,
    marginTop: 3,
  },
  ticketDate: { color: colors.champagne, fontSize: 12, marginTop: 4, letterSpacing: 0.2 },
  perfRow: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  perfNotch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.ink,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  perfDash: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    marginHorizontal: 6,
  },
  ticketStub: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ticketRefLabel: { color: colors.textMuted, fontSize: 9, letterSpacing: 1.4 },
  ticketRef: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  ticketHint: { color: colors.mutedText, fontSize: 11, marginTop: spacing.sm },
  qrMini: { padding: 5, backgroundColor: colors.white, borderRadius: 10 },

  // TicketQR
  qrFrame: { alignItems: 'center' },
  qrWhite: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 20,
    ...goldShadow,
  },

  // FloatingBottomNav — 68px glass bar, never overlaps content
  navFloat: { position: 'absolute', left: spacing.lg, right: spacing.lg },
  navPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(11,11,12,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    paddingVertical: 10,
    ...cardShadow,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIconWrap: {
    width: 40,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: { backgroundColor: colors.goldSoft },
  navLabel: { color: colors.textMuted, fontSize: 10, fontWeight: typography.fontWeight.medium, marginTop: 3 },
  navLabelActive: { color: colors.champagne, fontWeight: typography.fontWeight.semibold },

  // Bottom sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetPanel: {
    backgroundColor: '#101012',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  sheetGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.glassStrong,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.cardHeading,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
});
