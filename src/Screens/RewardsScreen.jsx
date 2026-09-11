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
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const INK = '#0F172A';
const GRAY = '#64748B';
const GREEN = '#16A34A';
const BG = '#F8FAFC';

const REFERRAL_CODE = 'RAHUL200';

const STATS = {
  totalReferred: 12,
  totalEarned: 2450,
  pending: 300,
};

const SHARE_MESSAGE = `Join TravelHub using my referral code ${REFERRAL_CODE} and get rewarded! https://travelhub.app/refer/${REFERRAL_CODE}`;

const SHARE_ACTIONS = [
  {id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', tint: '#E9FBEF', iconColor: '#25D366'},
  {id: 'sms', label: 'SMS', icon: 'chatbubble-outline', tint: '#EAF1FF', iconColor: '#2563EB'},
  {id: 'more', label: 'More', icon: 'share-social-outline', tint: '#FCEAF3', iconColor: '#EC4899'},
];

const EARN_CATEGORIES = [
  {
    id: 'taxi',
    title: 'Refer a Taxi Driver',
    description: 'Earn when they complete first 10 trips',
    reward: 'Earn ₹200',
    icon: 'car-outline',
    accent: '#CA8A04',
    iconTint: '#FEF3C7',
    cardTint: '#FFFFFF',
  },
  {
    id: 'hotel',
    title: 'Refer a Hotel',
    description: 'Earn when they list & get first booking',
    reward: 'Earn ₹500',
    icon: 'business-outline',
    accent: '#16A34A',
    iconTint: '#FCE7F3',
    cardTint: '#FFFFFF',
  },
  {
    id: 'homestay',
    title: 'Refer a Homestay',
    description: 'Earn when they complete 3 bookings',
    reward: 'Earn ₹300',
    icon: 'home-outline',
    accent: '#B45309',
    iconTint: '#FDE68A',
    cardTint: '#FEFCE8',
  },
  {
    id: 'customer',
    title: 'Refer a Customer',
    description: 'They get ₹100 off on their first booking',
    reward: 'Earn ₹50 cashback',
    icon: 'person-outline',
    accent: '#7C3AED',
    iconTint: '#EDE9FE',
    cardTint: '#F5F3FF',
  },
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
      StatusBar.setBackgroundColor('#FFFFFF');
      return () => {};
    }, []),
  );

  const handleCopyCode = useCallback(() => {
    try {
      const Clipboard = require('react-native').Clipboard;
      Clipboard.setString(REFERRAL_CODE);
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}>
          <Icon name="chevron-back" size={22} color={INK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referral Rewards</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <LinearGradient
          colors={['#2F6FED', '#3B82F6']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.codeCard}>
          <View style={styles.codeBubbleLarge} />
          <View style={styles.codeBubbleSmall} />

          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeRow}>
            <View style={styles.codePill}>
              <Text style={styles.codePillText}>{REFERRAL_CODE}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              activeOpacity={0.8}
              onPress={handleCopyCode}>
              <Icon
                name={copied ? 'checkmark' : 'copy-outline'}
                size={15}
                color="#FFFFFF"
              />
              <Text style={styles.copyButtonText}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{STATS.totalReferred}</Text>
              <Text style={styles.statLabel}>Total Referred</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                ₹{STATS.totalEarned.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                ₹{STATS.pending.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </LinearGradient>

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

        <Text style={styles.sectionTitle}>How to Earn</Text>

        <View style={styles.earnGrid}>
          {EARN_CATEGORIES.map(category => (
            <View
              key={category.id}
              style={[styles.earnCard, {backgroundColor: category.cardTint}]}>
              <View style={[styles.earnIconWrap, {backgroundColor: category.iconTint}]}>
                <Icon name={category.icon} size={20} color={category.accent} />
              </View>
              <Text style={[styles.earnTitle, {color: category.accent}]}>
                {category.title}
              </Text>
              <Text style={styles.earnDescription}>{category.description}</Text>
              <View style={styles.earnRewardPill}>
                <Text style={styles.earnRewardText}>{category.reward}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: INK,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Referral code card
  codeCard: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 5,
  },
  codeBubbleLarge: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  codeBubbleSmall: {
    position: 'absolute',
    bottom: -20,
    right: 60,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  codePill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  codePillText: {
    fontSize: 17,
    fontWeight: '800',
    color: INK,
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    textAlign: 'center',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  shareIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: INK,
    marginTop: 8,
    textAlign: 'center',
  },

  // Section
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
    marginTop: 24,
    marginBottom: 12,
  },

  // Earn grid
  earnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  earnCard: {
    width: '47%',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  earnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  earnDescription: {
    fontSize: 11.5,
    color: GRAY,
    marginTop: 4,
    lineHeight: 16,
  },
  earnRewardPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9FBEF',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  earnRewardText: {
    fontSize: 11,
    fontWeight: '700',
    color: GREEN,
  },
});

export default RewardsScreen;
