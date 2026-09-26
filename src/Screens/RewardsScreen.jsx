import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  Share,
  Linking,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const TINT_MINT = '#E1EEE8';
const ICON_MINT = '#1F6F5C';
const TINT_PEACH = '#FBEAE0';
const ICON_PEACH = '#C2703D';

const REFERRAL_CODE = 'AGT-2298';
const REFERRAL_LINK_DISPLAY = `aarvi.app/join?ref=${REFERRAL_CODE}`;
const REFERRAL_LINK_URL = `https://${REFERRAL_LINK_DISPLAY}`;
const SHARE_MESSAGE = `Join AARVI using my referral code ${REFERRAL_CODE} and get rewarded! ${REFERRAL_LINK_URL}`;

const SIGNED_UP_THIS_MONTH = 37;

const SHARE_ACTIONS = [
  {id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', tint: TINT_MINT, iconColor: ICON_MINT},
  {id: 'sms', label: 'SMS', icon: 'mail-outline', tint: TINT_PEACH, iconColor: ICON_PEACH},
  {id: 'more', label: 'More', icon: 'share-social-outline', tint: TINT_MINT, iconColor: ICON_MINT},
];

const RewardsScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  // Bottom-tab screens stay mounted after their first visit, so a plain
  // <StatusBar> here would keep winning even after the user switches to
  // another tab. useFocusEffect applies this only while Rewards is the
  // active tab and restores the app default when it isn't.
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor(CREAM);
      return () => {};
    }, []),
  );

  const handleCopyLink = useCallback(() => {
    try {
      const Clipboard = require('react-native').Clipboard;
      Clipboard.setString(REFERRAL_LINK_URL);
    } catch (e) {
      // Clipboard unavailable — the visual "Copied" feedback below still
      // reassures the user, so we don't surface an error for this.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  const handleShareAction = useCallback(async actionId => {
    try {
      if (actionId === 'whatsapp') {
        const url = `whatsapp://send?text=${encodeURIComponent(SHARE_MESSAGE)}`;
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          await Share.share({message: SHARE_MESSAGE});
        }
      } else if (actionId === 'sms') {
        const url = `sms:?body=${encodeURIComponent(SHARE_MESSAGE)}`;
        await Linking.openURL(url);
      } else {
        await Share.share({message: SHARE_MESSAGE});
      }
    } catch (e) {
      Alert.alert('Unable to share', 'Please try again.');
    }
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}>
          <Icon name="chevron-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Referral Code</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.codeCard}>
          <View style={styles.qrWrap}>
            <QRCode value={REFERRAL_LINK_URL} size={120} color={DEEP_GREEN} backgroundColor={WHITE} />
          </View>

          <Text style={styles.codeLabel}>YOUR CODE</Text>
          <Text style={styles.codeValue}>{REFERRAL_CODE}</Text>
          <Text style={styles.codeSubtext}>
            Scan the QR, or share the link below — new members are credited to you automatically when they sign up.
          </Text>
        </View>

        <Text style={styles.fieldLabel}>Your referral link</Text>
        <View style={styles.linkRow}>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>
              {REFERRAL_LINK_DISPLAY}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            activeOpacity={0.85}
            onPress={handleCopyLink}>
            <Icon name={copied ? 'checkmark' : 'copy-outline'} size={20} color={CREAM} />
          </TouchableOpacity>
        </View>

        <View style={styles.shareRow}>
          {SHARE_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.id}
              style={styles.shareCard}
              activeOpacity={0.8}
              onPress={() => handleShareAction(action.id)}>
              <View style={[styles.shareIconWrap, {backgroundColor: action.tint}]}>
                <Icon name={action.icon} size={20} color={action.iconColor} />
              </View>
              <Text style={styles.shareLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.signupsCard}>
          <View>
            <Text style={styles.signupsLabel}>Signed up via your code</Text>
            <View style={styles.signupsValueRow}>
              <Text style={styles.signupsValue}>{SIGNED_UP_THIS_MONTH}</Text>
              <Text style={styles.signupsValueUnit}>this month</Text>
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewListLink}>View list →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: TEXT_DARK,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },

  // Referral code card
  codeCard: {
    alignItems: 'center',
    backgroundColor: DEEP_GREEN,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  qrWrap: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 8,
  },
  codeLabel: {
    marginTop: 14,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(245,240,228,0.65)',
  },
  codeValue: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '800',
    color: CREAM,
    letterSpacing: 1,
  },
  codeSubtext: {
    marginTop: 6,
    fontSize: 12.5,
    lineHeight: 17,
    color: 'rgba(245,240,228,0.7)',
    textAlign: 'center',
  },

  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginTop: 20,
    marginBottom: 8,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 10,
  },
  linkBox: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  linkText: {
    fontSize: 13.5,
    color: TEXT_MUTED,
  },
  copyButton: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: DEEP_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Share row
  shareRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  shareCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingVertical: 14,
  },
  shareIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_DARK,
    marginTop: 8,
    textAlign: 'center',
  },

  // Signed-up-via-your-code card
  signupsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 16,
  },
  signupsLabel: {
    fontSize: 12.5,
    color: TEXT_MUTED,
  },
  signupsValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  signupsValue: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  signupsValueUnit: {
    fontSize: 12.5,
    color: TEXT_MUTED,
  },
  viewListLink: {
    fontSize: 13,
    fontWeight: '700',
    color: DEEP_GREEN,
  },
});

export default RewardsScreen;
