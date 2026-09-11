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
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const INK = '#0F172A';
const GRAY = '#64748B';
const BLUE = '#2F6FED';
const BG = '#F8FAFC';

const USER = {
  name: 'Rahul Sharma',
  phone: '+91 98765 43210',
  email: 'rahul.sharma@email.com',
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

const MENU_ITEMS = [
  {id: 'addresses', label: 'Saved Addresses', icon: 'location-outline'},
  {id: 'payments', label: 'Payment Methods', icon: 'card-outline'},
  {id: 'language', label: 'Language', icon: 'globe-outline', badgeKey: 'language'},
  {
    id: 'insurance',
    label: 'Insurance Policies',
    icon: 'shield-checkmark-outline',
    badge: '2 Active',
    route: 'Insurance',
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
      StatusBar.setBackgroundColor(BLUE);
      return () => {};
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
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient
          colors={['#2F6FED', '#3B82F6']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.header, {paddingTop: insets.top + 16}]}>
          <View style={styles.headerBubbleLarge} />
          <View style={styles.headerBubbleSmall} />

          <View style={styles.identityRow}>
            <View style={styles.avatarWrap}>
              <Image source={{uri: USER.avatar}} style={styles.avatar} />
              <View style={styles.avatarEditBadge}>
                <Icon name="pencil" size={11} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.identityText}>
              <Text style={styles.name}>{USER.name}</Text>
              <View style={styles.identityDetailRow}>
                <Icon name="call-outline" size={12} color="rgba(255,255,255,0.85)" />
                <Text style={styles.identityDetail}>{USER.phone}</Text>
              </View>
              <View style={styles.identityDetailRow}>
                <Icon name="mail-outline" size={12} color="rgba(255,255,255,0.85)" />
                <Text style={styles.identityDetail}>{USER.email}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{STATS.trips}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statRatingRow}>
              <Text style={styles.statValue}>{STATS.rating}</Text>
              <Icon name="star" size={14} color="#F59E0B" style={styles.statRatingIcon} />
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
                <Icon name={item.icon} size={18} color={BLUE} />
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
              <Icon name="chevron-forward" size={18} color="#CBD5E1" />
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
    backgroundColor: BG,
  },
  content: {
    paddingBottom: 24,
  },

  // Header
  header: {
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerBubbleSmall: {
    position: 'absolute',
    top: 40,
    right: 70,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 68,
    height: 68,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  identityText: {
    flex: 1,
  },
  name: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  identityDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  identityDetail: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },

  // Stats card — overlaps the header
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 20,
    marginTop: -28,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
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
    fontSize: 16,
    fontWeight: '800',
    color: INK,
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: GRAY,
    marginTop: 3,
  },

  // Language
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: GRAY,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  languageRow: {
    paddingHorizontal: 20,
    gap: 10,
  },
  languagePill: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  languagePillSelected: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  languagePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: INK,
  },
  languagePillTextSelected: {
    color: '#FFFFFF',
  },

  // Menu
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 20,
    marginTop: 24,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: INK,
  },
  languageBadge: {
    backgroundColor: '#EAF1FF',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 4,
  },
  languageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BLUE,
  },
  activeBadge: {
    backgroundColor: '#E9FBEF',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 4,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
});

export default ProfileScreen;
