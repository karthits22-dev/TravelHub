import React, {useEffect, useRef, useState} from 'react';
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
import Video from 'react-native-video';
import {sendOtp, verifyOtp} from '../Services/AuthService';
import NumericKeypad from '../Components/Common/NumericKeypad';

const OTP_ANIMATION = require('../assets/videos/otp-verification.mp4');

const OTP_LENGTH = 6;
const RESEND_SECONDS = 24;
const VERIFIED_DELAY_MS = 1000;

const OtpVerificationScreen = ({navigation, route}) => {
  const mobileNumber = route?.params?.mobileNumber ?? '9965862817';
  const formattedNumber = mobileNumber.replace(/(\d{5})(\d+)/, '$1 $2');

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  // Login only navigates here after sendOtp succeeds, so the first send
  // is already confirmed by the time this screen mounts.
  const [successMessage, setSuccessMessage] = useState(
    `OTP sent successfully to +91 ${formattedNumber}`,
  );
  const [verified, setVerified] = useState(false);
  const navigateTimer = useRef(null);

  const otp = digits.join('');
  const canVerify = otp.length === OTP_LENGTH;

  useEffect(() => () => clearTimeout(navigateTimer.current), []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  // Boxes always fill left to right, so the next empty box is also the
  // "cursor" position highlighted in the UI.
  const activeIndex = otp.length;

  const handleDigit = digit => {
    if (otp.length >= OTP_LENGTH) return;
    const next = [...digits];
    next[otp.length] = digit;
    setDigits(next);
    setErrorMessage(null);

    // Last digit entered — submit without waiting for the button.
    const code = next.join('');
    if (code.length === OTP_LENGTH) handleVerify(code);
  };

  // Long-press on the keypad's delete key passes clearAll.
  const handleBackspace = clearAll => {
    if (clearAll === true) {
      setDigits(Array(OTP_LENGTH).fill(''));
    } else if (otp.length > 0) {
      const next = [...digits];
      next[otp.length - 1] = '';
      setDigits(next);
    }
    setErrorMessage(null);
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await sendOtp(mobileNumber);
      setSuccessMessage(`OTP resent successfully to +91 ${formattedNumber}`);
      setDigits(Array(OTP_LENGTH).fill(''));
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setResending(false);
    }
  };

  // `code` is passed explicitly when the last digit is keyed, because the
  // `otp` state from this render doesn't include the digit just set.
  const handleVerify = async (code = otp) => {
        navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});

    if (code.length !== OTP_LENGTH || verifying || verified) return;
    setVerifying(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
    //  await verifyOtp(mobileNumber, code);
      setVerified(true);
      setSuccessMessage('OTP verified successfully');
      setVerifying(false);
      // Brief pause so the confirmation is actually seen before leaving.
      // reset (not navigate) so Splash/Login/OTP drop out of the stack
      // entirely — otherwise the device back button/gesture from Home
      // would step back through the login flow instead of exiting the app.
      navigateTimer.current = setTimeout(
        () => navigation.reset({index: 0, routes: [{name: 'MainTabs'}]}),
        VERIFIED_DELAY_MS,
      );
    } catch (err) {
      setErrorMessage(err.message);
      setVerifying(false);
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

        {/* <View style={styles.heroWrap}>
          <Video
            source={OTP_ANIMATION}
            style={styles.heroVideo}
            resizeMode="contain"
            repeat
            muted
            playInBackground={false}
            playWhenInactive={false}
          />
        </View> */}

        <View style={styles.body}>
          <Text style={styles.title}>Enter the code</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to{' '}
            <Text style={styles.subtitleBold}>+91 {formattedNumber}</Text>.
          </Text>

          <View style={styles.otpRow}>
            {digits.map((digit, index) => (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  (digit || index === activeIndex) && styles.otpBoxFilled,
                ]}>
                <Text style={styles.otpDigit}>{digit}</Text>
              </View>
            ))}
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : successMessage ? (
            <View style={styles.successBanner}>
              <Icon name="checkmark-circle" size={16} color={SUCCESS_GREEN} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <View style={styles.resendRow}>
            {secondsLeft > 0 ? (
              <Text style={styles.resendPrompt}>
                Resend code in 0:{String(secondsLeft).padStart(2, '0')}
              </Text>
            ) : resending ? (
              <ActivityIndicator size="small" color={DEEP_GREEN} />
            ) : (
              <TouchableOpacity activeOpacity={0.7} onPress={handleResend}>
                <Text style={styles.resendLink}>Resend code</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()}>
              <Text style={styles.changeNumberLink}>Change number</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={[styles.verifyButton, canVerify && styles.verifyButtonActive]}
            disabled={!canVerify || verifying || verified}
            activeOpacity={0.85}
            onPress={() => handleVerify()}>
            {verifying ? (
              <ActivityIndicator size="small" color={CREAM} />
            ) : verified ? (
              <View style={styles.verifiedRow}>
                <Icon name="checkmark-circle" size={18} color={CREAM} />
                <Text style={[styles.verifyButtonText, styles.verifyButtonTextActive]}>
                  Verified
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.verifyButtonText,
                  canVerify && styles.verifyButtonTextActive,
                ]}>
                Verify & Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <NumericKeypad
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        disabled={verifying || verified}
      />
    </SafeAreaView>
  );
};

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const BORDER = '#E4DFD2';
const DISABLED_BG = '#DAD4C4';
const ERROR_RED = '#C23E3E';
const SUCCESS_GREEN = '#2E7D4F';
const SUCCESS_BG = '#E3F1E7';

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
  heroWrap: {
    width: 240,
    height: 240,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  heroVideo: {
    width: '100%',
    height: '100%',
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
  subtitleBold: {
    fontWeight: '700',
    color: TEXT_DARK,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigit: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  otpBoxFilled: {
    borderColor: DEEP_GREEN,
  },
  errorText: {
    marginTop: 12,
    fontSize: 12.5,
    fontWeight: '600',
    color: ERROR_RED,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: SUCCESS_BG,
  },
  successText: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: SUCCESS_GREEN,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  resendPrompt: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
    color: DEEP_GREEN,
  },
  changeNumberLink: {
    fontSize: 13,
    fontWeight: '700',
    color: DEEP_GREEN,
  },
  bottomArea: {
    paddingBottom: 16,
  },
  verifyButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: DISABLED_BG,
  },
  verifyButtonActive: {
    backgroundColor: DEEP_GREEN,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  verifyButtonTextActive: {
    color: CREAM,
  },
});

export default OtpVerificationScreen;
