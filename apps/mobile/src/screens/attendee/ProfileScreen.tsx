import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card } from '../../components/card';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../hooks/useAuth';
import { profileService } from '../../services/profile';
import { RootStackParamList, AttendeeStackParamList } from '../../navigation/types';
import { Button } from '../../components';
import { colors,  typography } from '../../theme';

type IconName =
  | 'person'
  | 'ticket'
  | 'gift'
  | 'lock'
  | 'mail'
  | 'bell'
  | 'shield'
  | 'help'
  | 'info'
  | 'logout'
  | 'trash'
  | 'scan'
  | 'chevron';

function Icon({
  name,
  size = 20,
  color = colors.textPrimary,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const stroke = color;
  const common = {
    width: size,
    height: size,
    borderColor: stroke,
  };

  switch (name) {
    case 'person':
      return (
        <View style={[common, styles.iconPerson]}>
          <View style={[styles.personHead, { borderColor: stroke }]} />
          <View style={[styles.personBody, { borderColor: stroke }]} />
        </View>
      );

    case 'ticket':
      return (
        <View
          style={[
            common,
            styles.ticketIcon,
            { borderColor: stroke },
          ]}
        >
          <View style={[styles.ticketLine, { backgroundColor: stroke }]} />
          <View style={[styles.ticketLine, { backgroundColor: stroke }]} />
        </View>
      );

    case 'gift':
      return (
        <View style={[common, styles.giftIcon, { borderColor: stroke }]}>
          <View style={[styles.giftTop, { borderColor: stroke }]} />
          <View style={[styles.giftVertical, { backgroundColor: stroke }]} />
        </View>
      );

    case 'lock':
      return (
        <View style={[common, styles.lockIcon]}>
          <View style={[styles.lockShackle, { borderColor: stroke }]} />
          <View style={[styles.lockBody, { borderColor: stroke }]} />
        </View>
      );

    case 'mail':
      return (
        <View style={[common, styles.mailIcon, { borderColor: stroke }]}>
          <View
            style={[
              styles.mailDiagonalLeft,
              { borderColor: stroke },
            ]}
          />
          <View
            style={[
              styles.mailDiagonalRight,
              { borderColor: stroke },
            ]}
          />
        </View>
      );

    case 'bell':
      return (
        <View style={[common, styles.bellIcon]}>
          <View style={[styles.bellBody, { borderColor: stroke }]} />
          <View style={[styles.bellClapper, { backgroundColor: stroke }]} />
        </View>
      );

    case 'shield':
      return (
        <View style={[common, styles.shieldIcon, { borderColor: stroke }]}>
          <View style={[styles.shieldCheckOne, { backgroundColor: stroke }]} />
          <View style={[styles.shieldCheckTwo, { backgroundColor: stroke }]} />
        </View>
      );

    case 'help':
      return (
        <View style={[common, styles.circleIcon, { borderColor: stroke }]}>
          <Text style={[styles.iconText, { color: stroke }]}>?</Text>
        </View>
      );

    case 'info':
      return (
        <View style={[common, styles.circleIcon, { borderColor: stroke }]}>
          <Text style={[styles.iconText, { color: stroke }]}>i</Text>
        </View>
      );

    case 'logout':
      return (
        <View style={[common, styles.logoutIcon]}>
          <View style={[styles.logoutDoor, { borderColor: stroke }]} />
          <View style={[styles.logoutArrow, { backgroundColor: stroke }]} />
        </View>
      );

    case 'trash':
      return (
        <View style={[common, styles.trashIcon]}>
          <View style={[styles.trashBody, { borderColor: stroke }]} />
          <View style={[styles.trashLid, { backgroundColor: stroke }]} />
        </View>
      );

    case 'scan':
      return (
        <View style={[common, styles.scanIcon, { borderColor: stroke }]}>
          <View style={[styles.scanCornerTL, { borderColor: stroke }]} />
          <View style={[styles.scanCornerTR, { borderColor: stroke }]} />
          <View style={[styles.scanCornerBL, { borderColor: stroke }]} />
          <View style={[styles.scanCornerBR, { borderColor: stroke }]} />
        </View>
      );

    case 'chevron':
      return (
        <View style={styles.chevronIcon}>
          <View style={[styles.chevronPartA, { borderColor: stroke }]} />
          <View style={[styles.chevronPartB, { borderColor: stroke }]} />
        </View>
      );

    default:
      return null;
  }
}

function initialsFor(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return 'CP';

  return parts
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const { session, profile, signOut, refresh, roles } = useAuth();

  const rootNav =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const nav =
    useNavigation<NativeStackNavigationProp<AttendeeStackParamList>>();

  const isVolunteer = roles.includes('VOLUNTEER');

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name ?? '');
  const [editCity, setEditCity] = useState(profile?.city ?? '');
  const [saving, setSaving] = useState(false);

  const displayName = profile?.full_name?.trim() || 'CtrlPass Member';

  const initials = useMemo(
    () => initialsFor(displayName),
    [displayName],
  );

  const cityLabel = profile?.city
    ? `${profile.city}${profile.state ? `, ${profile.state}` : ''}`
    : null;

  async function handleSave() {
    if (!session?.user?.id) return;

    const trimmedName = editName.trim();
    const trimmedCity = editCity.trim();

    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }

    setSaving(true);

    try {
      await profileService.upsertProfile(session.user.id, {
        full_name: trimmedName,
        city: trimmedCity,
      });

      await refresh();
      setEditing(false);
    } catch (err) {
      Alert.alert(
        'Could not save',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  function beginEditing() {
    setEditName(profile?.full_name ?? '');
    setEditCity(profile?.city ?? '');
    setEditing(true);
  }

  function cancelEditing() {
    setEditName(profile?.full_name ?? '');
    setEditCity(profile?.city ?? '');
    setEditing(false);
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 120,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>CTRL PASS</Text>
              <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <View style={styles.headerMark}>
              <Text style={styles.headerMarkText}>CP</Text>
            </View>
          </View>

          {/* Identity */}
          <View style={styles.identitySection}>
            <View style={styles.avatarWrap}>
              {profile?.profile_image_url ? (
                <Image
                  source={{ uri: profile.profile_image_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}

              <View style={styles.avatarDot} />
            </View>

            {editing ? (
              <View style={styles.editPanel}>
                <Text style={styles.inputLabel}>FULL NAME</Text>

                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your full name"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="next"
                />

                <Text style={[styles.inputLabel, styles.cityLabel]}>
                  CITY
                </Text>

                <TextInput
                  style={styles.input}
                  value={editCity}
                  onChangeText={setEditCity}
                  placeholder="Your city"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                />

                <View style={styles.editButtons}>
                  <Button
                    title="Save changes"
                    loading={saving}
                    onPress={handleSave}
                    style={styles.saveButton}
                  />

                  <Pressable
                    onPress={cancelEditing}
                    style={({ pressed }) => [
                      styles.cancelButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.name}>{displayName}</Text>

                {session?.user?.email ? (
                  <Text style={styles.email}>
                    {session.user.email}
                  </Text>
                ) : null}

                {profile?.phone ? (
                  <Text style={styles.secondaryMeta}>
                    {profile.phone}
                  </Text>
                ) : null}

                {cityLabel ? (
                  <Text style={styles.secondaryMeta}>
                    {cityLabel}
                  </Text>
                ) : null}

                <Pressable
                  onPress={beginEditing}
                  accessibilityRole="button"
                  accessibilityLabel="Edit profile"
                  style={({ pressed }) => [
                    styles.editProfileButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon
                    name="person"
                    size={15}
                    color={colors.champagne}
                  />
                  <Text style={styles.editProfileText}>
                    Edit profile
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Quick actions */}
          {!editing ? (
            <Card style={styles.quickActions}>
              <QuickAction
                icon="ticket"
                label="Orders"
                onPress={() =>
                  nav.navigate('AttendeeTabs', {
                    tab: 'Bookings',
                  })
                }
              />

              <QuickAction
                icon="gift"
                label="Refer & Earn"
                accent
                onPress={() => nav.navigate('Referrals')}
              />

              <QuickAction
                icon="bell"
                label="Alerts"
                onPress={() =>
                  nav.navigate('NotificationSettings')
                }
              />
            </Card>
          ) : null}

          {/* Volunteer */}
          {isVolunteer ? (
            <View style={styles.volunteerBlock}>
              <View style={styles.volunteerCopy}>
                <Text style={styles.volunteerEyebrow}>
                  VOLUNTEER MODE
                </Text>

                <Text style={styles.volunteerTitle}>
                  Gate scanner
                </Text>

                <Text style={styles.volunteerSubtitle}>
                  Verify passes for your assigned events.
                </Text>
              </View>

              <Pressable
                onPress={() => rootNav.navigate('Volunteer')}
                accessibilityRole="button"
                accessibilityLabel="Launch gate scanner"
                style={({ pressed }) => [
                  styles.scanButton,
                  pressed && styles.pressed,
                ]}
              >
                <Icon
                  name="scan"
                  size={21}
                  color={colors.ink}
                />
              </Pressable>
            </View>
          ) : null}

          {/* Account */}
          <Section
            title="Account"
            rows={[
              {
                icon: 'lock',
                label: 'Change password',
                onPress: () => nav.navigate('ChangePassword'),
              },
              {
                icon: 'mail',
                label: 'Change email',
                onPress: () => nav.navigate('ChangeEmail'),
              },
              {
                icon: 'bell',
                label: 'Notification settings',
                onPress: () =>
                  nav.navigate('NotificationSettings'),
              },
            ]}
          />

          {/* Privacy */}
          <Section
            title="Privacy & support"
            rows={[
              {
                icon: 'shield',
                label: 'Privacy center',
                onPress: () => nav.navigate('PrivacyCenter'),
              },
              {
                icon: 'help',
                label: 'Help & support',
                onPress: () =>
                  nav.navigate('Info', { doc: 'help' }),
              },
              {
                icon: 'info',
                label: 'About CtrlPass',
                onPress: () =>
                  nav.navigate('Info', { doc: 'about' }),
              },
            ]}
          />

          {/* Legal */}
          <View style={styles.legalSection}>
            <Pressable
              onPress={() =>
                nav.navigate('Info', { doc: 'terms' })
              }
              style={({ pressed }) => [
                styles.legalLink,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.legalText}>
                Terms of Service
              </Text>
            </Pressable>

            <View style={styles.legalDivider} />

            <Pressable
              onPress={() =>
                nav.navigate('Info', { doc: 'privacy' })
              }
              style={({ pressed }) => [
                styles.legalLink,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.legalText}>
                Privacy Policy
              </Text>
            </Pressable>
          </View>

          {/* Sign out */}
          <Pressable
            onPress={signOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.pressed,
            ]}
          >
            <Icon
              name="logout"
              size={19}
              color={colors.textPrimary}
            />

            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>

          {/* Delete */}
          <Pressable
            onPress={() => nav.navigate('DeleteAccount')}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.pressed,
            ]}
          >
            <Icon
              name="trash"
              size={17}
              color={colors.error}
            />

            <Text style={styles.deleteText}>
              Delete account
            </Text>
          </Pressable>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLine} />

            <Text style={styles.footerBrand}>CTRL PASS</Text>

            <Text style={styles.footerVersion}>
              v1.0.0
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  accent,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.quickAction,
        accent && styles.quickActionAccent,
        pressed && styles.pressed,
      ]}
    >
      <Icon
        name={icon}
        size={20}
        color={
          accent
            ? colors.champagne
            : colors.textPrimary
        }
      />

      <Text
        style={[
          styles.quickActionText,
          accent && styles.quickActionTextAccent,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Section({
  title,
  rows,
}: {
  title: string;
  rows: {
    icon: IconName;
    label: string;
    onPress: () => void;
  }[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.sectionList}>
        {rows.map((row, index) => (
          <Pressable
            key={row.label}
            onPress={row.onPress}
            accessibilityRole="button"
            accessibilityLabel={row.label}
            style={({ pressed }) => [
              styles.row,
              index !== rows.length - 1 && styles.rowDivider,
              pressed && styles.rowPressed,
            ]}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Icon
                  name={row.icon}
                  size={18}
                  color={colors.textSecondary}
                />
              </View>

              <Text style={styles.rowLabel}>
                {row.label}
              </Text>
            </View>

            <Icon
              name="chevron"
              size={15}
              color={colors.textMuted}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
  },

  flex: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
  },

  pressed: {
    opacity: 0.65,
  },

  /* Header */

  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 34,
  },


  headerEyebrow: {
    color: colors.champagne,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 5,
  },


  headerTitle: {
    color: colors.textPrimary,
    fontSize: 32,
    lineHeight: 37,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -1.1,
  },

  headerMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.3)',
    backgroundColor: 'rgba(214,180,122,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },


  headerMarkText: {
    color: colors.champagne,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },

  /* Identity */

  identitySection: {
    alignItems: 'center',
    paddingBottom: 34,
  },

  avatarWrap: {
    width: 104,
    height: 104,
    marginBottom: 19,
    position: 'relative',
  },

  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.surface,
  },

  avatarFallback: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },


  avatarInitials: {
    color: colors.champagne,
    fontSize: 31,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -1,
  },

  avatarDot: {
    position: 'absolute',
    right: 3,
    bottom: 5,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: colors.ink,
  },


  name: {
    color: colors.textPrimary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.9,
    textAlign: 'center',
  },

  email: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 7,
    textAlign: 'center',
  },

  secondaryMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },

  editProfileButton: {
    height: 40,
    marginTop: 18,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.28)',
    backgroundColor: 'rgba(214,180,122,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  editProfileText: {
    color: colors.champagne,
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
  },

  /* Editing */

  editPanel: {
    width: '100%',
    marginTop: 4,
  },


  inputLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 7,
  },

  cityLabel: {
    marginTop: 14,
  },

  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#292929',
    paddingHorizontal: 16,
    color: colors.textPrimary,
    fontSize: 15,
  },

  editButtons: {
    marginTop: 18,
  },

  saveButton: {
    width: '100%',
  },

  cancelButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
  },

  /* Quick actions */

  quickActions: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 38,
  },

  quickAction: {
    flex: 1,
    minHeight: 74,
    borderRadius: 16,
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#202020',
    paddingHorizontal: 13,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },

  quickActionAccent: {
    backgroundColor: 'rgba(214,180,122,0.075)',
    borderColor: 'rgba(214,180,122,0.22)',
  },

  quickActionText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
  },

  quickActionTextAccent: {
    color: colors.champagne,
  },

  /* Volunteer */

  volunteerBlock: {
    minHeight: 116,
    marginBottom: 38,
    borderRadius: 20,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#282828',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  volunteerCopy: {
    flex: 1,
    paddingRight: 14,
  },


  volunteerEyebrow: {
    color: colors.champagne,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 7,
  },


  volunteerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.3,
  },

  volunteerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  scanButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.champagne,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Sections */

  section: {
    marginBottom: 35,
  },


  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 12,
    textTransform: 'uppercase',
  },

  sectionList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#202020',
  },

  row: {
    minHeight: 61,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#202020',
  },

  rowPressed: {
    opacity: 0.55,
  },

  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  rowLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
  },

  /* Legal */

  legalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 31,
  },

  legalLink: {
    paddingHorizontal: 8,
    paddingVertical: 7,
  },

  legalText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
  },

  legalDivider: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.textMuted,
  },

  /* Sign out */

  signOutButton: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#282828',
    backgroundColor: '#101010',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  signOutText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
  },

  deleteButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 5,
  },

  deleteText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
  },

  /* Footer */

  footer: {
    alignItems: 'center',
    marginTop: 26,
  },

  footerLine: {
    width: 36,
    height: 1,
    backgroundColor: '#292929',
    marginBottom: 15,
  },


  footerBrand: {
    color: '#5C5C5C',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },

  footerVersion: {
    color: '#414141',
    fontSize: 9,
    marginTop: 5,
  },

  /* Icon primitives */

  iconPerson: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  personHead: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    marginTop: 1,
  },

  personBody: {
    width: 13,
    height: 7,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    marginTop: 3,
  },

  ticketIcon: {
    borderWidth: 1.5,
    borderRadius: 4,
    justifyContent: 'center',
    gap: 3,
  },

  ticketLine: {
    width: 8,
    height: 1,
    alignSelf: 'center',
    opacity: 0.8,
  },

  giftIcon: {
    borderWidth: 1.5,
    borderRadius: 3,
    justifyContent: 'flex-end',
  },

  giftTop: {
    position: 'absolute',
    top: 2,
    left: -2,
    right: -2,
    height: 4,
    borderWidth: 1.5,
    borderRadius: 2,
  },

  giftVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    left: '50%',
  },

  lockIcon: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  lockShackle: {
    width: 9,
    height: 8,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },

  lockBody: {
    width: 14,
    height: 11,
    borderWidth: 1.5,
    borderRadius: 3,
  },

  mailIcon: {
    borderWidth: 1.5,
    borderRadius: 3,
    overflow: 'hidden',
  },

  mailDiagonalLeft: {
    position: 'absolute',
    width: 9,
    height: 1.5,
    left: 0,
    top: 5,
    transform: [{ rotate: '32deg' }],
  },

  mailDiagonalRight: {
    position: 'absolute',
    width: 9,
    height: 1.5,
    right: 0,
    top: 5,
    transform: [{ rotate: '-32deg' }],
  },

  bellIcon: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  bellBody: {
    width: 15,
    height: 15,
    borderWidth: 1.5,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },

  bellClapper: {
    width: 4,
    height: 2,
    borderRadius: 2,
    marginTop: 2,
  },

  shieldIcon: {
    borderWidth: 1.5,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },

  shieldCheckOne: {
    position: 'absolute',
    width: 5,
    height: 1.5,
    left: 3,
    top: 9,
    transform: [{ rotate: '45deg' }],
  },

  shieldCheckTwo: {
    position: 'absolute',
    width: 8,
    height: 1.5,
    left: 6,
    top: 7,
    transform: [{ rotate: '-45deg' }],
  },

  circleIcon: {
    borderWidth: 1.5,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },

  logoutIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutDoor: {
    position: 'absolute',
    left: 2,
    width: 9,
    height: 15,
    borderWidth: 1.5,
    borderRightWidth: 0,
    borderRadius: 2,
  },

  logoutArrow: {
    width: 12,
    height: 1.5,
    marginLeft: 5,
  },

  trashIcon: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  trashBody: {
    width: 12,
    height: 13,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },

  trashLid: {
    width: 16,
    height: 1.5,
    borderRadius: 1,
    marginBottom: 2,
  },

  scanIcon: {
    borderWidth: 1.5,
    borderRadius: 3,
  },

  scanCornerTL: {
    position: 'absolute',
    width: 6,
    height: 6,
    left: -1,
    top: -1,
    borderLeftWidth: 1.5,
    borderTopWidth: 1.5,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },

  scanCornerTR: {
    position: 'absolute',
    width: 6,
    height: 6,
    right: -1,
    top: -1,
    borderRightWidth: 1.5,
    borderTopWidth: 1.5,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },

  scanCornerBL: {
    position: 'absolute',
    width: 6,
    height: 6,
    left: -1,
    bottom: -1,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },

  scanCornerBR: {
    position: 'absolute',
    width: 6,
    height: 6,
    right: -1,
    bottom: -1,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },

  chevronIcon: {
    width: 12,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chevronPartA: {
    position: 'absolute',
    width: 7,
    height: 1.5,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
    top: 6,
  },

  chevronPartB: {
    position: 'absolute',
    width: 7,
    height: 1.5,
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
    top: 10,
  },
});