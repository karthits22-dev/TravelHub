import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
// RN's built-in SafeAreaView is a no-op on Android; this one actually
// measures real insets on both platforms (required now that Android 15+
// enforces edge-to-edge for all screens, not just ones that opt in).
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {sendOtp} from '../Services/AuthService';
import NumericKeypad from '../Components/Common/NumericKeypad';

const PHONE_LENGTH = 10;

const LoginScreen = ({navigation}) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const canContinue = mobileNumber.trim().length >= 10;
  const formattedNumber = mobileNumber.replace(/(\d{5})(\d+)/, '$1 $2');

  const handleDigit = digit => {
    if (mobileNumber.length >= PHONE_LENGTH) return;
    setMobileNumber(mobileNumber + digit);
    setErrorMessage(null);
  };

  // Long-press on the keypad's delete key passes clearAll.
  const handleBackspace = clearAll => {
    setMobileNumber(clearAll === true ? '' : mobileNumber.slice(0, -1));
    setErrorMessage(null);
  };

  const handleSendOtp = async () => {
    if (!canContinue || sending) return;
    setSending(true);
    setErrorMessage(null);
    try {
     await sendOtp(mobileNumber.trim());
      navigation.navigate('OtpAuth', {mobileNumber});
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    // No 'bottom' edge: NumericKeypad handles the home-indicator inset
    // itself so its background reaches the bottom of the screen.
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}>
          <Icon name="chevron-back" size={18} color={DEEP_GREEN} />
        </TouchableOpacity>

        <View style={styles.body}>
          <Text style={styles.title}>Log in or sign up</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number — we'll send a one-time code to verify it.
          </Text>

          <Text style={styles.label}>Mobile number</Text>
          <View style={styles.inputRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            {/* Display-only: digits come from the NumericKeypad below. */}
            <View style={styles.input}>
              {mobileNumber ? (
                <Text style={styles.inputText}>{formattedNumber}</Text>
              ) : (
                <Text style={[styles.inputText, styles.placeholderText]}>
                  98450 12345
                </Text>
              )}
            </View>
          </View>

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <View style={styles.referralHint}>
            <Icon name="person-outline" size={16} color={TEXT_MUTED} />
            <Text style={styles.referralHintText}>
              Have an AMC agent referral code? You can add it after verifying
              your number.
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={[styles.sendButton, canContinue && styles.sendButtonActive]}
            disabled={!canContinue || sending}
            activeOpacity={0.85}
            onPress={handleSendOtp}>
            {sending ? (
              <ActivityIndicator size="small" color={CREAM} />
            ) : (
              <Text
                style={[
                  styles.sendButtonText,
                  canContinue && styles.sendButtonTextActive,
                ]}>
                Send OTP
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <NumericKeypad
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        disabled={sending}
      />
    </SafeAreaView>
  );
};

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const LIGHT_TEXT = '#9CA6A1';
const BORDER = '#E4DFD2';
const DISABLED_BG = '#DAD4C4';
const ERROR_RED = '#C23E3E';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  body: {
    marginTop: 24,
  },
  spacer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT_MUTED,
  },
  label: {
    marginTop: 28,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countryCode: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: DEEP_GREEN,
  },
  inputText: {
    fontSize: 15,
    color: TEXT_DARK,
  },
  placeholderText: {
    color: LIGHT_TEXT,
  },
  errorText: {
    marginTop: 10,
    fontSize: 12.5,
    fontWeight: '600',
    color: ERROR_RED,
  },
  referralHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    padding: 14,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  referralHintText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: TEXT_MUTED,
  },
  bottomArea: {
    paddingBottom: 16,
  },
  sendButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: DISABLED_BG,
  },
  sendButtonActive: {
    backgroundColor: DEEP_GREEN,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  sendButtonTextActive: {
    color: CREAM,
  },
});

export default LoginScreen;
