import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {INITIAL_RENEWALS} from '../Data/renewalDocuments';
import {getRenewalStatus} from '../Utils/renewalStatus';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const BORDER = '#E4DFD2';
const TINT_MINT = '#E1EEE8';
const ICON_MINT = '#1F6F5C';
const ICON_PEACH = '#C2703D';

const USER = {
  name: 'Sharma',
  phone: '+91 98765 43210',
  email: 'sharma@email.com',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
};

const STATS = {
  trips: 28,
  rating: 4.9,
  wallet: 4084,
};

const LANGUAGES = [
  {code: 'en', label: 'English'},
  {code: 'ta', label: 'தமிழ்'},
  {code: 'hi', label: 'हिंदी'},
  {code: 'kn', label: 'ಕನ್ನಡ'},
  {code: 'te', label: 'తెలుగు'},
  {code: 'ml', label: 'മലയാളം'},
];

// Menu badge counts how many tracked documents currently need attention
// (lapsing soon or already lapsed), so it stays honest as records change
// instead of a hand-typed number drifting out of sync.
const RENEWALS_DUE_COUNT = INITIAL_RENEWALS.filter(item =>
  ['lapsing', 'lapsed'].includes(getRenewalStatus(item)),
).length;

const MENU_ITEMS = [
  {id: 'addresses', label: 'Saved Addresses', icon: 'location-outline'},
  {id: 'payments', label: 'Payment Methods', icon: 'card-outline'},
  {id: 'language', label: 'Language', icon: 'globe-outline', badgeKey: 'language'},
  {
    id: 'renewals',
    label: 'Renewals & Reminders',
    icon: 'time-outline',
    badge: RENEWALS_DUE_COUNT > 0 ? `${RENEWALS_DUE_COUNT} Due` : undefined,
    route: 'Renewals',
  },
  {id: 'driver', label: 'Driver Dashboard', icon: 'car-outline'},
  {id: 'hotelPartner', label: 'Hotel Partner Dashboard', icon: 'business-outline'},
];

const ProfileScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [languageCode, setLanguageCode] = useState('en');

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

  const handleMenuPress = useCallback(
    item => {
      if (item.route) {
        navigation?.navigate?.(item.route);
        return;
      }
      if (item.id === 'language') {
        return;
      }
      Alert.alert(item.label, 'This is coming soon.');
    },
    [navigation],
  );

  const currentLanguage = LANGUAGES.find(l => l.code === languageCode)?.label;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_GREEN} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.header, {paddingTop: insets.top + 16}]}>
          <View style={styles.headerBubbleLarge} />
          <View style={styles.headerBubbleSmall} />

          <View style={styles.identityRow}>
            <View style={styles.avatarWrap}>
              <Image source={{uri: USER.avatar}} style={styles.avatar} />
              <View style={styles.avatarEditBadge}>
                <Icon name="pencil" size={11} color={WHITE} />
              </View>
            </View>

            <View style={styles.identityText}>
              <Text style={styles.name}>{USER.name}</Text>
              <View style={styles.identityDetailRow}>
                <Icon name="call-outline" size={12} color="rgba(245,240,228,0.75)" />
                <Text style={styles.identityDetail}>{USER.phone}</Text>
              </View>
              <View style={styles.identityDetailRow}>
                <Icon name="mail-outline" size={12} color="rgba(245,240,228,0.75)" />
                <Text style={styles.identityDetail}>{USER.email}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{STATS.trips}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statRatingRow}>
              <Text style={styles.statValue}>{STATS.rating}</Text>
              <Icon name="star" size={13} color="#F59E0B" style={styles.statRatingIcon} />
            </View>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{STATS.wallet.toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Wallet</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Language</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.languageRow}>
          {LANGUAGES.map(lang => {
            const selected = lang.code === languageCode;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.languagePill, selected && styles.languagePillSelected]}
                activeOpacity={0.8}
                onPress={() => setLanguageCode(lang.code)}>
                <Text
                  style={[
                    styles.languagePillText,
                    selected && styles.languagePillTextSelected,
                  ]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuRow,
                index < MENU_ITEMS.length - 1 && styles.menuRowDivider,
              ]}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item)}>
              <View style={styles.menuIconWrap}>
                <Icon name={item.icon} size={17} color={ICON_MINT} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.badgeKey === 'language' && (
                <View style={styles.languageBadge}>
                  <Text style={styles.languageBadgeText}>{currentLanguage}</Text>
                </View>
              )}
              {item.badge && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Icon name="chevron-forward" size={17} color={TEXT_MUTED} />
            </TouchableOpacity>
          ))}
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
  content: {
    paddingBottom: 24,
  },

  // Header
  header: {
    backgroundColor: DEEP_GREEN,
    paddingHorizontal: 20,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  headerBubbleLarge: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(245,240,228,0.08)',
  },
  headerBubbleSmall: {
    position: 'absolute',
    top: 40,
    right: 70,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(245,240,228,0.08)',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 64,
    height: 64,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(245,240,228,0.6)',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: ICON_PEACH,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DEEP_GREEN,
  },
  identityText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: CREAM,
  },
  identityDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  identityDetail: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(245,240,228,0.75)',
  },

  // Stats card — overlaps the header
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: -28,
    paddingVertical: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: BORDER,
  },
  statRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statRatingIcon: {
    marginLeft: 3,
    marginTop: -1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: TEXT_MUTED,
    marginTop: 3,
  },

  // Language
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: TEXT_MUTED,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  languageRow: {
    paddingHorizontal: 20,
    gap: 9,
  },
  languagePill: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  languagePillSelected: {
    backgroundColor: DEEP_GREEN,
    borderColor: DEEP_GREEN,
  },
  languagePillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  languagePillTextSelected: {
    color: CREAM,
  },

  // Menu
  menuCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 22,
    paddingHorizontal: 15,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 11,
  },
  menuRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: TINT_MINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  languageBadge: {
    backgroundColor: TINT_MINT,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 9,
    marginRight: 4,
  },
  languageBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: ICON_MINT,
  },
  activeBadge: {
    backgroundColor: TINT_MINT,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 9,
    marginRight: 4,
  },
  activeBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: ICON_MINT,
  },
});

export default ProfileScreen;
