import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';

const BLUE = '#0057FF';
const WHITE = '#FFFFFF';
const FRAME_SIZE = 250;
const CORNER_SIZE = 32;

const INK = '#0F172A';
const GRAY = '#64748B';
const BORDER = '#E5E7EB';
const SUCCESS_BG = '#F8FAFC';
const GREEN = '#16A34A';

function ordinalSuffix(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'st';
  if (n % 10 === 2 && n % 100 !== 12) return 'nd';
  if (n % 10 === 3 && n % 100 !== 13) return 'rd';
  return 'th';
}

// There's no real property-management backend behind this scan, so the room
// assignment is synthesized here — enough to make the success screen read
// as a real check-in confirmation instead of a bare "Checked in" toast.
function generateStayDetails(booking) {
  const roomNumber = 100 + Math.floor(Math.random() * 400);
  const floorNumber = Math.max(1, Math.floor(roomNumber / 100));
  const now = new Date();
  return {
    roomNumber: String(roomNumber),
    floorLabel: `${floorNumber}${ordinalSuffix(floorNumber)} Floor`,
    checkInLabel: `Today, ${now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    checkOutLabel: booking?.dateLabel ?? 'As per booking',
    guestsLabel: '2 Guests',
    reference: `TH-${Math.floor(100000 + Math.random() * 900000)}`,
  };
}

function DetailRow({icon, label, value}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>
        <Icon name={icon} size={16} color={BLUE} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const CheckInScanScreen = ({navigation, route}) => {
  const booking = route?.params?.booking;

  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();
  // Guards against onCodeScanned firing repeatedly for the same code while
  // frames keep coming in during the Alert/navigation that follows a scan.
  const hasHandledScan = useRef(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const [checkInResult, setCheckInResult] = useState(null);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (!(hasPermission && device)) return undefined;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hasPermission, device, scanLineAnim]);

  const handleCheckedIn = useCallback(
    value => {
      if (hasHandledScan.current) return;
      hasHandledScan.current = true;

      setCheckInResult(generateStayDetails(booking));
    },
    [booking],
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      const value = codes?.[0]?.value;
      if (value) handleCheckedIn(value);
    },
  });

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, FRAME_SIZE - 10],
  });

  if (checkInResult) {
    return (
      <View style={styles.successScreen}>
        <StatusBar barStyle="dark-content" backgroundColor={SUCCESS_BG} />
        <SafeAreaView style={styles.successSafeArea} edges={['top', 'bottom']}>
          <ScrollView
            contentContainerStyle={styles.successScroll}
            showsVerticalScrollIndicator={false}>
            <View style={styles.successBadge}>
              <Icon name="checkmark" size={44} color={WHITE} />
            </View>

            <Text style={styles.successTitle}>Checked In Successfully</Text>
            <Text style={styles.successSubtitle}>
              {booking?.name
                ? `Welcome to ${booking.name}`
                : 'Your check-in is confirmed.'}
            </Text>

            <View style={styles.detailsCard}>
              <View style={styles.roomBadgeRow}>
                <View style={styles.roomNumberBox}>
                  <Text style={styles.roomNumberValue}>
                    {checkInResult.roomNumber}
                  </Text>
                  <Text style={styles.roomNumberLabel}>Room No.</Text>
                </View>
                <View style={styles.roomBadgeDivider} />
                <View style={styles.roomNumberBox}>
                  <Text style={styles.roomNumberValue}>
                    {checkInResult.floorLabel}
                  </Text>
                  <Text style={styles.roomNumberLabel}>Floor</Text>
                </View>
              </View>

              <View style={styles.detailsList}>
                <DetailRow
                  icon="calendar-outline"
                  label="Check-in"
                  value={checkInResult.checkInLabel}
                />
                <DetailRow
                  icon="log-out-outline"
                  label="Check-out"
                  value={checkInResult.checkOutLabel}
                />
                <DetailRow
                  icon="people-outline"
                  label="Guests"
                  value={checkInResult.guestsLabel}
                />
                <DetailRow
                  icon="pricetag-outline"
                  label="Booking Ref"
                  value={checkInResult.reference}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              activeOpacity={0.85}
              onPress={() => navigation?.goBack?.()}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* <StatusBar barStyle="light-content" translucent backgroundColor="transparent" /> */}

      {hasPermission && device ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          codeScanner={codeScanner}
        />
      ) : (
        <View style={styles.fallback} />
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0)']}
        style={styles.topScrim}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']}
        style={styles.bottomScrim}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleButton}
            activeOpacity={0.8}
            onPress={() => navigation?.goBack?.()}>
            <Icon name="chevron-back" size={22} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan to Check-in</Text>
          <View style={styles.circleButton} />
        </View>

        {hasPermission && device ? (
          <View style={styles.frameWrap}>
            {booking?.name ? (
              <View style={styles.bookingChip}>
                <Icon name="bed-outline" size={13} color={BLUE} />
                <Text style={styles.bookingLabel} numberOfLines={1}>
                  {booking.name}
                </Text>
              </View>
            ) : null}

            <View style={styles.frame}>
              <Animated.View
                style={[
                  styles.scanLine,
                  {transform: [{translateY: scanLineTranslateY}]},
                ]}
              />
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>

            <Text style={styles.instructions}>
              Point your camera at the QR code on your booking confirmation or
              at the front desk kiosk.
            </Text>
          </View>
        ) : (
          <View style={styles.permissionWrap}>
            <View style={styles.permissionIconBadge}>
              <Icon
                name={device ? 'camera-outline' : 'videocam-off-outline'}
                size={34}
                color={WHITE}
              />
            </View>
            <Text style={styles.permissionTitle}>
              {device ? 'Camera access needed' : 'No camera available'}
            </Text>
            <Text style={styles.permissionBody}>
              {device
                ? 'Allow camera access to scan the check-in QR code.'
                : "This device doesn't have a usable camera."}
            </Text>
            {device ? (
              <TouchableOpacity
                style={styles.permissionButton}
                activeOpacity={0.85}
                onPress={async () => {
                  const granted = await requestPermission();
                  if (!granted) Linking.openSettings();
                }}>
                <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },

  frameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: BLUE,
    shadowColor: BLUE,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 0},
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: WHITE,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  instructions: {
    marginTop: 28,
    fontSize: 13,
    fontWeight: '600',
    color: WHITE,
    textAlign: 'center',
    lineHeight: 19,
  },
  bookingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: WHITE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: '100%',
  },
  bookingLabel: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
    color: BLUE,
    flexShrink: 1,
  },

  permissionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionIconBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,87,255,0.25)',
  },
  permissionTitle: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
  permissionBody: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 19,
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: WHITE,
  },

  successScreen: {
    flex: 1,
    backgroundColor: SUCCESS_BG,
  },
  successSafeArea: {
    flex: 1,
  },
  successScroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  successBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GREEN,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  successTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '800',
    color: INK,
    textAlign: 'center',
  },
  successSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: GRAY,
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
    marginTop: 28,
    backgroundColor: WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  roomBadgeRow: {
    flexDirection: 'row',
    backgroundColor: '#EAF2FF',
    paddingVertical: 18,
  },
  roomNumberBox: {
    flex: 1,
    alignItems: 'center',
  },
  roomNumberValue: {
    fontSize: 22,
    fontWeight: '800',
    color: BLUE,
  },
  roomNumberLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: GRAY,
  },
  roomBadgeDivider: {
    width: 1,
    backgroundColor: BORDER,
  },
  detailsList: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  detailIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF2FF',
  },
  detailLabel: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: GRAY,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: INK,
    maxWidth: '50%',
  },
  doneButton: {
    width: '100%',
    marginTop: 28,
    backgroundColor: BLUE,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: BLUE,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
  },
});

export default CheckInScanScreen;
