import React, { useState } from 'react';
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
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialIconGoogle from 'react-native-vector-icons/AntDesign';


const LoginScreen = ({ navigation }) => {
  const [mobileNumber, setMobileNumber] = useState('1111111111');
  const canContinue = mobileNumber.trim().length >= 10;

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
          <Text style={styles.title}>Welcome Back 👋</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey.</Text>
        </View>
      </SafeAreaView>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.label}>MOBILE NUMBER</Text>

        <View style={styles.inputRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>IN +91</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            maxLength={10}
            value={mobileNumber}
            onChangeText={setMobileNumber}
          />
        </View>

        <TouchableOpacity
          style={[styles.continueButton, canContinue && styles.continueButtonActive]}
          disabled={!canContinue}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('OtpAuth', { mobileNumber })}>
          <Text
            style={[
              styles.continueButtonText,
              canContinue && styles.continueButtonTextActive,
            ]}>
            Continue
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.socialButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('GoogleAuth')}>
          <MaterialIconGoogle name="google" size={15} color="#2093DA" />

          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.socialButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AppleAuth')}>
          <MaterialIcon name="apple" size={20} color="#666666" />

          <Text style={styles.socialButtonText}>Continue with Apple</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const BLUE = '#0057FF';
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
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FIELD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: INK,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 15,
    color: INK,
  },
  continueButton: {
    width: '100%',
    backgroundColor: FIELD_BG,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  continueButtonActive: {
    backgroundColor: BLUE,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LIGHT_GRAY,
  },
  continueButtonTextActive: {
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  dividerText: {
    fontSize: 12,
    color: GRAY,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 12,
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  appleIcon: {
    fontSize: 18,
    color: INK,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: INK,
  },
});

export default LoginScreen;