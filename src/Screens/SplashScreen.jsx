import React, {useCallback} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, StatusBar} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
// RN's built-in SafeAreaView is a no-op on Android; this one actually
// measures real insets on both platforms (required now that Android 15+
// enforces edge-to-edge for all screens, not just ones that opt in).
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const SplashScreen = ({navigation}) => {
  const handleGetStarted = () => {
    navigation.navigate('Login');
  };

  // Dark green background needs light status bar icons; App.jsx's global
  // default is dark-content, so this screen opts into light-content only
  // while it's focused and restores the default on the way out.
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor(DEEP_GREEN);
      return () => {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('#FFFFFF');
      };
    }, []),
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerArea}>
          <View style={styles.logoBadge}>
            <Icon name="home-outline" size={38} color={CREAM} />
          </View>
          <Text style={styles.brandName}>AARVI</Text>
          <Text style={styles.tagline}>
            Stays, rides, insurance & more —{'\n'}one membership.
          </Text>
        </View>

        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGetStarted}
            activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing, you agree to AARVI's Terms of Service and Privacy
            Policy.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DEEP_GREEN,
  },
  safeArea: {
    flex: 1,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: CREAM,
    letterSpacing: 1,
  },
  tagline: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(245,240,228,0.72)',
    textAlign: 'center',
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: CREAM,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: DEEP_GREEN,
    fontWeight: '700',
    fontSize: 16,
  },
  terms: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(245,240,228,0.55)',
  },
});

export default SplashScreen;
