import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

// Phone-style letters under each digit, as on the system dial pad.
const KEYS = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PQRS'],
  ['8', 'TUV'],
  ['9', 'WXYZ'],
];

// Always-visible in-app number pad, used instead of the system keyboard
// on the login and OTP screens. Render it as the last child of a screen
// whose SafeAreaView omits the 'bottom' edge — the pad pads itself for
// the home indicator so its background runs to the bottom of the screen.
const NumericKeypad = ({onDigit, onBackspace, disabled = false}) => {
  const insets = useSafeAreaInsets();

  const renderKey = (digit, letters) => (
    <TouchableOpacity
      key={digit}
      style={styles.key}
      activeOpacity={0.6}
      disabled={disabled}
      onPress={() => onDigit(digit)}>
      <Text style={styles.keyDigit}>{digit}</Text>
      {letters ? <Text style={styles.keyLetters}>{letters}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.pad, {paddingBottom: Math.max(insets.bottom, 8)}]}>
      <View style={styles.row}>{KEYS.slice(0, 3).map(k => renderKey(...k))}</View>
      <View style={styles.row}>{KEYS.slice(3, 6).map(k => renderKey(...k))}</View>
      <View style={styles.row}>{KEYS.slice(6, 9).map(k => renderKey(...k))}</View>
      <View style={styles.row}>
        <View style={styles.keyBlank} />
        {renderKey('0', '')}
        <TouchableOpacity
          style={styles.keyBlank}
          activeOpacity={0.6}
          disabled={disabled}
          onPress={onBackspace}
          onLongPress={() => onBackspace(true)}
          accessibilityLabel="Delete">
          <Icon name="backspace-outline" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const PAD_BG = '#E7E1D3';

const styles = StyleSheet.create({
  pad: {
    backgroundColor: PAD_BG,
    paddingTop: 8,
    paddingHorizontal: 6,
    gap: 7,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  key: {
    flex: 1,
    height: 48,
    borderRadius: 6,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle bottom edge like system keys.
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 0,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
  },
  keyBlank: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDigit: {
    fontSize: 24,
    fontWeight: '400',
    color: TEXT_DARK,
    lineHeight: 28,
  },
  keyLetters: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: TEXT_MUTED,
  },
});

export default NumericKeypad;
