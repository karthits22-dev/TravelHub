import React, {useEffect, useMemo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import {formatWeekdayDate} from '../../Utils/stayDates';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const BORDER = '#E4DFD2';
const TINT_MINT = '#E1EEE8';
const ICON_MINT = '#1F6F5C';

const BookingConfirmedScreen = ({navigation, route}) => {
  const {
    stayId = 'stay',
    stayName = 'Your stay',
    roomName = '',
    checkIn,
    checkOut,
    amountPaid = 0,
  } = route?.params ?? {};

  // Deterministic per booking (not random) so re-rendering this screen
  // never shows a different booking ID than the one already confirmed.
  const bookingId = useMemo(() => {
    const suffix = stayId
      .split('')
      .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 100000, 7);
    return `AARVI-HTL-${String(suffix).padStart(5, '0')}`;
  }, [stayId]);

  // The booking is already paid for by the time this screen shows, so no
  // back action (hardware back, iOS swipe-back gesture, or a stray goBack()
  // call) should ever be able to pop back into the list/detail/payment
  // screens underneath — this intercepts every one of them and sends the
  // guest straight to Home instead, no matter how the stack got here.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      event.preventDefault();
      // reset() also removes this screen, which would fire this same
      // listener again (and again) if it were still subscribed — unsubscribe
      // first so the reset can complete without looping back into itself.
      unsubscribe();
      navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <View style={styles.body}>
        <View style={styles.checkCircle}>
          <Icon name="checkmark" size={40} color={ICON_MINT} />
        </View>

        <Text style={styles.title}>Booking Confirmed</Text>
        <Text style={styles.subtitle}>
          A confirmation has been sent to your registered phone number.
        </Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValueBold}>{bookingId}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hotel</Text>
            <Text style={styles.detailValueBold}>{stayName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Room</Text>
            <Text style={styles.detailValueBold}>{roomName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Check-in</Text>
            <Text style={styles.detailValueBold}>{formatWeekdayDate(checkIn)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Check-out</Text>
            <Text style={styles.detailValueBold}>{formatWeekdayDate(checkOut)}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabelBold}>Amount paid</Text>
            <Text style={styles.amountPaidValue}>₹{amountPaid.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => navigation?.replace?.('MainTabs')}>
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() =>
            // reset (not navigate) — AllHotels isn't already in the stack
            // at this point, so a plain navigate would push it on top of
            // this screen, leaving BookingConfirmed sitting underneath and
            // reachable again by backing out of AllHotels.
            navigation?.reset?.({
              index: 1,
              routes: [{name: 'MainTabs'}, {name: 'AllHotels'}],
            })
          }>
          <Text style={styles.secondaryButtonText}>Browse more stays</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: TINT_MINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },

  detailsCard: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 18,
    marginTop: 28,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  detailLabelBold: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  detailValueBold: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  detailDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 4,
  },
  amountPaidValue: {
    fontSize: 16,
    fontWeight: '800',
    color: DEEP_GREEN,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: DEEP_GREEN,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: CREAM,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: TEXT_DARK,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default BookingConfirmedScreen;
