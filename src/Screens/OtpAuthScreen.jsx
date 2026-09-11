import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
// RN's built-in SafeAreaView is a no-op on Android; this one actually
// measures real insets on both platforms (required now that Android 15+
// enforces edge-to-edge for all screens, not just ones that opt in).
import {SafeAreaView} from 'react-native-safe-area-context';

const OTP_LENGTH = 6;
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';


const OtpVerificationScreen = ({navigation, route}) => {
  const mobileNumber = route?.params?.mobileNumber ?? '9965862817';
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef([]);

  const otp = digits.join('');
  const canVerify = otp.length === OTP_LENGTH;

  const handleChange = (text, index) => {
    const value = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.circleAccent} />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}>
            <MaterialIcon name="arrow-back-ios-new" size={15} color="white" />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to +91 {mobileNumber}
          </Text>
        </View>
      </SafeAreaView>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.label}>ENTER OTP</Text>

        <View style={styles.otpRow}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => (inputRefs.current[index] = ref)}
              style={[styles.otpBox, digit && styles.otpBoxFilled]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={text => handleChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
            />
          ))}
        </View>

        <View style={styles.resendRow}>
          <Text style={styles.resendPrompt}>Didn't receive OTP?</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.resendLink}>Resend</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, canVerify && styles.verifyButtonActive]}
          disabled={!canVerify}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('MainTabs')}>
          <Text
            style={[
              styles.verifyButtonText,
              canVerify && styles.verifyButtonTextActive,
            ]}>
            Verify & Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.changeNumberButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}>
          <Text style={styles.changeNumberText}>Change number</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const BLUE = '#0057FF';
const BLUE_DARK = '#0040CC';
const INK = '#111827';
const GRAY = '#6B7280';
const LIGHT_GRAY = '#9CA3AF';
const BORDER = '#E5E7EB';
const FIELD_BG = '#F3F4F6';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: BLUE,
    paddingHorizontal: 20,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  circleAccent: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    marginTop: -2,
  },
  headerText: {
    gap: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: GRAY,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: FIELD_BG,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: INK,
  },
  otpBoxFilled: {
    borderColor: BLUE,
    backgroundColor: '#FFFFFF',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
    justifyContent:'space-between'
  },
  resendPrompt: {
    fontSize: 13,
    color: GRAY,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '600',
    color: BLUE,
  },
  verifyButton: {
    width: '100%',
    backgroundColor: FIELD_BG,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
    
  },
  verifyButtonActive: {
    backgroundColor: BLUE,
    shadowColor: BLUE_DARK,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LIGHT_GRAY,
  },
  verifyButtonTextActive: {
    color: '#FFFFFF',
  },
  changeNumberButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  changeNumberText: {
    fontSize: 14,
    fontWeight: '500',
    color: BLUE,
  },
});

export default OtpVerificationScreen;