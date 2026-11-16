import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Camera } from 'react-native-camera-kit';
import {
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { VolunteerStackParamList } from '../../navigation/types';
import { bookingService } from '../../services/bookings';
import { eventService } from '../../services/events';
import {
  organizerService,
  ScanRecord,
} from '../../services/organizer';
import { CheckInResult } from '../../types';
import { colors } from '../../theme';

/*
 * check_ins.result uses SUCCESS where the UI's CheckInResult union says VALID;
 * translate once here so the rest of the screen only deals with UI statuses.
 */
function toCheckInResult(scan: ScanRecord): CheckInResult {
  const meta = (scan.metadata ?? {}) as Record<string, unknown>;
  return {
    success: scan.result === 'SUCCESS',
    status: scan.result === 'SUCCESS' ? 'VALID' : scan.result,
    message:
      typeof meta.message === 'string' ? meta.message : '',
  };
}

type ScanOutcome = {
  result: CheckInResult;
  at: Date;
};

const RESULT_COLORS: Record<string, string> = {
  SUCCESS: '#7FBF9A',
  VALID: '#7FBF9A',
  DUPLICATE: '#D6B47A',
  ALREADY_CHECKED_IN: '#D6B47A',
  ENTRY_NOT_OPEN: '#D6B47A',
  ENTRY_CLOSED: '#D6B47A',
};

export default function QRScannerScreen() {
  const route =
    useRoute<
      RouteProp<VolunteerStackParamList, 'QRScanner'>
    >();

  const navigation =
    useNavigation<
      NativeStackNavigationProp<VolunteerStackParamList>
    >();

  const insets = useSafeAreaInsets();

  const eventId = route.params?.eventId ?? '';

  const [permission, setPermission] = useState<
    'unknown' | 'granted' | 'denied'
  >('unknown');

  const [torch, setTorch] = useState(false);
  const [eventName, setEventName] = useState('');
  const [lastOutcome, setLastOutcome] =
    useState<ScanOutcome | null>(null);
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState<
    ScanOutcome[]
  >([]);
  const [paused, setPaused] = useState(false);

  const busyUntil = useRef(0);

  /*
   * Camera permission
   */
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'android') {
        setPermission('granted');
        return;
      }

      const result =
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera permission',
            message:
              'CtrlPass needs camera access to scan gate passes.',
            buttonPositive: 'Allow',
            buttonNegative: 'Cancel',
          },
        );

      setPermission(
        result ===
          PermissionsAndroid.RESULTS.GRANTED
          ? 'granted'
          : 'denied',
      );
    })();
  }, []);

  /*
   * Event + previous scan history
   */
  useEffect(() => {
    if (!eventId) return;

    eventService
      .getById(eventId)
      .then(event => {
        setEventName(event?.name ?? '');
      });

    organizerService
      .myScans(eventId)
      .then((scans: ScanRecord[]) => {
        setCount(
          scans.filter(
            scan => scan.result === 'SUCCESS',
          ).length,
        );

        setHistory(
          scans.map(scan => ({
            result: toCheckInResult(scan),
            at: new Date(scan.scanned_at),
          })).slice(0, 10),
        );
      });
  }, [eventId]);

  /*
   * Real server-authoritative check-in.
   *
   * Continuous scanning is preserved:
   * VALID → short confirmation → camera resumes.
   * Everything else → ScanResult screen.
   */
  const handleCode = useCallback(
    async (code: string) => {
      const now = Date.now();

      if (
        paused ||
        now < busyUntil.current ||
        !code
      ) {
        return;
      }

      busyUntil.current = now + 1800;
      setPaused(true);

      try {
        const result =
          await bookingService.checkIn(
            code,
            eventId,
          );

        const outcome: ScanOutcome = {
          result,
          at: new Date(),
        };

        setLastOutcome(outcome);
        setHistory(current =>
          [outcome, ...current].slice(0, 10),
        );

        if (result.status === 'VALID') {
          setCount(current => current + 1);

          setTimeout(() => {
            setLastOutcome(null);
            setPaused(false);
          }, 900);
        } else {
          navigation.navigate('ScanResult', {
            eventId,
            result,
          });

          setTimeout(() => {
            setPaused(false);
          }, 400);
        }
      } catch (error: any) {
        Alert.alert(
          'Check-in failed',
          error?.message ??
            'Server error — try again.',
        );

        setPaused(false);
      }
    },
    [eventId, navigation, paused],
  );

  /*
   * Permission denied
   */
  if (permission === 'denied') {
    return (
      <SafeAreaView
        style={styles.permissionScreen}
        edges={['top', 'bottom']}
      >
        <View style={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <Text style={styles.permissionIconText}>
              +
            </Text>
          </View>

          <Text style={styles.permissionEyebrow}>
            GATE SCANNER
          </Text>

          <Text style={styles.permissionTitle}>
            Camera access{'\n'}is required.
          </Text>

          <Text style={styles.permissionBody}>
            CtrlPass needs camera access to verify
            attendee passes at the gate.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.permissionButton,
              pressed && styles.pressed,
            ]}
            onPress={async () => {
              if (Platform.OS !== 'android') {
                setPermission('granted');
                return;
              }

              const result =
                await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS
                    .CAMERA,
                );

              if (
                result ===
                PermissionsAndroid.RESULTS
                  .GRANTED
              ) {
                setPermission('granted');
              }
            }}
          >
            <Text style={styles.permissionButtonText}>
              Grant camera access
            </Text>

            <Text style={styles.permissionArrow}>
              →
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.permissionBack}
          >
            <Text style={styles.permissionBackText}>
              Go back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Camera */}

      {permission === 'granted' ? (
        <Camera
          style={StyleSheet.absoluteFill}
          scanBarcode
          showFrame={false}
          torchMode={torch ? 'on' : 'off'}
          onReadCode={event =>
            handleCode(
              event.nativeEvent.codeStringValue ??
                '',
            )
          }
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.cameraLoading,
          ]}
        >
          <Text style={styles.cameraLoadingText}>
            Preparing scanner…
          </Text>
        </View>
      )}

      {/* Camera readability overlays */}

      <View
        pointerEvents="none"
        style={styles.cameraShade}
      />

      <SafeAreaView
        pointerEvents="box-none"
        style={StyleSheet.absoluteFill}
        edges={['top', 'bottom']}
      >
        {/* Header */}

        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text
              style={styles.eventName}
              numberOfLines={1}
            >
              {eventName || 'Gate scanner'}
            </Text>

            <View style={styles.liveRow}>
              <View style={styles.liveDot} />

              <Text style={styles.liveText}>
                LIVE GATE
              </Text>

              <View style={styles.liveDivider} />

              <Text style={styles.countText}>
                {count} checked in
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() =>
              setTorch(current => !current)
            }
            accessibilityRole="button"
            accessibilityLabel="Toggle flashlight"
            style={({ pressed }) => [
              styles.headerButton,
              torch && styles.headerButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.flashIcon}>
              <View
                style={[
                  styles.flashBody,
                  torch && styles.flashBodyActive,
                ]}
              />
              <View
                style={[
                  styles.flashHead,
                  torch && styles.flashHeadActive,
                ]}
              />
            </View>
          </Pressable>
        </View>

        {/* Scanner center */}

        <View
          pointerEvents="none"
          style={styles.scannerArea}
        >
          <View style={styles.scannerFrame}>
            {/* Corners */}

            <View
              style={[
                styles.corner,
                styles.cornerTL,
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.cornerTR,
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.cornerBL,
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.cornerBR,
              ]}
            />

            {/* Scan line */}

            {!paused && (
              <View style={styles.scanLine} />
            )}
          </View>

          <View style={styles.scanInstruction}>
            <Text style={styles.scanInstructionTitle}>
              {paused
                ? 'Verifying pass'
                : 'Scan attendee pass'}
            </Text>

            <Text style={styles.scanInstructionBody}>
              {paused
                ? 'Checking with CtrlPass securely…'
                : 'Place the QR code inside the frame'}
            </Text>
          </View>
        </View>

        {/* VALID confirmation */}

        {lastOutcome?.result.status ===
          'VALID' && (
          <View
            pointerEvents="none"
            style={[
              styles.successOverlay,
              {
                top:
                  insets.top + 115,
              },
            ]}
          >
            <View style={styles.successIcon}>
              <Text style={styles.successCheck}>
                ✓
              </Text>
            </View>

            <View style={styles.successCopy}>
              <Text
                style={styles.successTitle}
                numberOfLines={1}
              >
                {lastOutcome.result
                  .attendee_name || 'VALID PASS'}
              </Text>

              <Text
                style={styles.successSubtitle}
                numberOfLines={1}
              >
                {lastOutcome.result.ticket_type ??
                  'Entry granted'}
              </Text>
            </View>

            <View style={styles.grantedPill}>
              <Text style={styles.grantedText}>
                GRANTED
              </Text>
            </View>
          </View>
        )}

        {/* Bottom history panel */}

        <View
          style={[
            styles.historyPanel,
            {
              paddingBottom:
                Math.max(insets.bottom, 10),
            },
          ]}
        >
          <View style={styles.historyHandle} />

          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.historyEyebrow}>
                SESSION ACTIVITY
              </Text>

              <Text style={styles.historyTitle}>
                Recent scans
              </Text>
            </View>

            <View style={styles.totalPill}>
              <Text style={styles.totalNumber}>
                {count}
              </Text>
              <Text style={styles.totalLabel}>
                ENTRY
                {count === 1 ? '' : 'IES'}
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={
              styles.historyContent
            }
          >
            {history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <View
                  style={styles.emptyHistoryIcon}
                >
                  <Text
                    style={
                      styles.emptyHistoryIconText
                    }
                  >
                    —
                  </Text>
                </View>

                <View>
                  <Text style={styles.emptyTitle}>
                    Waiting for first scan
                  </Text>

                  <Text
                    style={styles.emptySubtitle}
                  >
                    Verified entries will appear here.
                  </Text>
                </View>
              </View>
            ) : (
              history.map((item, index) => {
                const status =
                  item.result.status;

                const statusColor =
                  RESULT_COLORS[status] ??
                  '#D96B6B';

                const isSuccess = status === 'VALID';

                return (
                  <View
                    key={`${item.at.getTime()}-${index}`}
                    style={styles.historyRow}
                  >
                    <View
                      style={[
                        styles.resultIndicator,
                        {
                          backgroundColor:
                            statusColor,
                        },
                      ]}
                    />

                    <View
                      style={
                        styles.historyRowCopy
                      }
                    >
                      <Text
                        style={[
                          styles.historyStatus,
                          {
                            color: statusColor,
                          },
                        ]}
                      >
                        {isSuccess
                          ? 'ENTRY GRANTED'
                          : status.replace(
                              /_/g,
                              ' ',
                            )}
                      </Text>

                      <Text
                        style={styles.historyName}
                        numberOfLines={1}
                      >
                        {item.result
                          .attendee_name ??
                          item.result.message ??
                          'Scan result'}
                      </Text>
                    </View>

                    <Text
                      style={styles.historyTime}
                    >
                      {item.at.toLocaleTimeString(
                        [],
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  cameraLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090909',
  },

  cameraLoadingText: {
    color: '#8A867F',
    fontSize: 12,
  },

  cameraShade: {
    ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    backgroundColor: 'rgba(0,0,0,0.16)',
  },

  /* ───────── Header ───────── */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  headerButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: 'rgba(8,8,8,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerButtonActive: {
    backgroundColor: 'rgba(214,180,122,0.18)',
    borderColor: 'rgba(214,180,122,0.42)',
  },

  backArrow: {
    color: '#F5F5F2',
    fontSize: 29,
    lineHeight: 28,
    marginTop: -2,
  },

  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },


  eventName: {
    color: '#F5F5F2',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7FBF9A',
    marginRight: 6,
  },


  liveText: {
    color: '#B8B4AC',
    fontSize: 11,
    fontWeight: '800',
      },

  liveDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 7,
  },

  countText: {
    color: colors.textMuted,
    fontSize: 9,
  },

  /* ───────── Flashlight icon ───────── */

  flashIcon: {
    width: 18,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  flashBody: {
    width: 9,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#D8D5CE',
    transform: [{ rotate: '18deg' }],
  },

  flashHead: {
    position: 'absolute',
    top: 1,
    width: 13,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D8D5CE',
    transform: [{ rotate: '18deg' }],
  },

  flashBodyActive: {
    backgroundColor: '#D6B47A',
  },

  flashHeadActive: {
    backgroundColor: '#D6B47A',
  },

  /* ───────── Scanner ───────── */

  scannerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -70,
  },

  scannerFrame: {
    width: 258,
    height: 258,
    position: 'relative',
  },

  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: '#F4E7CC',
  },

  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 13,
  },

  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 13,
  },

  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 13,
  },

  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 13,
  },

  scanLine: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: '50%',
    height: 2,
    backgroundColor: '#D6B47A',
    shadowColor: '#D6B47A',
    shadowOpacity: 0.7,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: 5,
  },

  scanInstruction: {
    alignItems: 'center',
    marginTop: 22,
  },

  scanInstructionTitle: {
    color: '#F5F5F2',
    fontSize: 13,
    fontWeight: '700',
  },

  scanInstructionBody: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 10,
    marginTop: 5,
  },

  /* ───────── Success ───────── */

  successOverlay: {
    position: 'absolute',
    left: 18,
    right: 18,
    minHeight: 70,
    borderRadius: 20,
    backgroundColor: 'rgba(13,20,16,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(127,191,154,0.42)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  successIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#7FBF9A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  successCheck: {
    color: '#07100B',
    fontSize: 21,
    fontWeight: '900',
  },

  successCopy: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  successTitle: {
    color: '#F1F4F0',
    fontSize: 13,
    fontWeight: '700',
  },

  successSubtitle: {
    color: '#8DA394',
    fontSize: 10,
    marginTop: 3,
  },

  grantedPill: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(127,191,154,0.11)',
  },


  grantedText: {
    color: '#7FBF9A',
    fontSize: 11,
    fontWeight: '800',
      },

  /* ───────── History ───────── */

  historyPanel: {
    maxHeight: 232,
    backgroundColor: 'rgba(6,6,6,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18,
    paddingTop: 9,
  },

  historyHandle: {
    alignSelf: 'center',
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#3A3834',
    marginBottom: 13,
  },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  historyEyebrow: {
    color: '#625E58',
    fontSize: 11,
    fontWeight: '800',
      },

  historyTitle: {
    color: '#E7E4DD',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },

  totalPill: {
    minWidth: 58,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#11110F',
    borderWidth: 1,
    borderColor: '#252420',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 9,
  },

  totalNumber: {
    color: '#D6B47A',
    fontSize: 15,
    fontWeight: '700',
  },


  totalLabel: {
    color: '#625E58',
    fontSize: 11,
    fontWeight: '800',
        marginLeft: 4,
  },

  historyContent: {
    paddingTop: 10,
    paddingBottom: 3,
  },

  historyRow: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#181816',
  },

  resultIndicator: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 10,
  },

  historyRowCopy: {
    flex: 1,
  },


  historyStatus: {
    fontSize: 11,
    fontWeight: '800',
      },

  historyName: {
    color: '#B8B4AC',
    fontSize: 10,
    marginTop: 3,
  },

  historyTime: {
    color: '#5C5953',
    fontSize: 9,
    marginLeft: 10,
  },

  emptyHistory: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#181816',
    paddingTop: 8,
  },

  emptyHistoryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#10100F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  emptyHistoryIconText: {
    color: '#55514B',
    fontSize: 15,
  },

  emptyTitle: {
    color: '#A7A39B',
    fontSize: 10,
    fontWeight: '600',
  },

  emptySubtitle: {
    color: '#5C5953',
    fontSize: 9,
    marginTop: 3,
  },

  /* ───────── Permission ───────── */

  permissionScreen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  permissionIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.28)',
    backgroundColor: 'rgba(214,180,122,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  permissionIconText: {
    color: '#D6B47A',
    fontSize: 23,
    fontWeight: '500',
  },


  permissionEyebrow: {
    color: '#9E7B48',
    fontSize: 11,
    fontWeight: '800',
        marginBottom: 12,
  },


  permissionTitle: {
    color: '#F5F5F2',
    fontSize: 37,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -1.4,
  },

  permissionBody: {
    color: '#817D76',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 16,
    maxWidth: 340,
  },

  permissionButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#E8E3D9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },

  permissionButtonText: {
    color: '#090909',
    fontSize: 13,
    fontWeight: '700',
  },

  permissionArrow: {
    color: '#090909',
    fontSize: 18,
    marginLeft: 9,
  },

  permissionBack: {
    alignItems: 'center',
    paddingVertical: 18,
  },

  permissionBackText: {
    color: colors.textMuted,
    fontSize: 11,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});