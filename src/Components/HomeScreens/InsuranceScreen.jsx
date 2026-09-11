import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const INK = '#111827';
const GRAY = '#6B7280';
const BORDER = '#E5E7EB';
const BG = '#F8FAFC';

// Shared press feedback — every tappable card/button springs down slightly
// on press and back up on release, instead of just the flat activeOpacity
// dim the rest of the app uses.
const ScaleTouchable = ({style, onPress, children, activeScale = 0.96, ...rest}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      {...rest}>
      <Animated.View style={[style, {transform: [{scale}]}]}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

const DETAIL_ROW_COUNT = 4;

const POLICIES = [
  {
    id: 'taxi',
    icon: '🚕',
    title: 'Taxi Insurance',
    description: 'Comprehensive coverage for taxi operators & passengers',
    badge: 'Popular',
    color: '#3B82F6',
    tint: '#EAF2FF',
    gradient: ['#5B93FF', '#2563EB'],
    features: [
      'Third-party liability',
      'Own damage cover',
      'Passenger cover',
      '24/7 claim support',
    ],
    price: 3200,
    priceUnit: '/year',
    details: {
      'Policy Duration': '1 Year',
      'Sum Insured': '₹10 Lakh',
      'Claim Settlement': '24 hours',
      'Network Hospitals': '5,000+',
    },
  },
  {
    id: 'car',
    icon: '🚗',
    title: 'Car Insurance',
    description: 'Full protection for personal & commercial vehicles',
    badge: 'Best Value',
    color: '#16A34A',
    tint: '#E9FBEF',
    gradient: ['#34D399', '#16A34A'],
    features: [
      'Comprehensive cover',
      'Zero depreciation',
      'Roadside assistance',
      'NCB protection',
    ],
    price: 4800,
    priceUnit: '/year',
    details: {
      'Policy Duration': '1 Year',
      'Sum Insured': '₹10 Lakh',
      'Claim Settlement': '24 hours',
      'Network Hospitals': '5,000+',
    },
  },
  {
    id: 'travel',
    icon: '✈️',
    title: 'Travel Insurance',
    description: 'Secure your journey against trip cancellations & emergencies',
    badge: 'Recommended',
    color: '#F97316',
    tint: '#FFF1E4',
    gradient: ['#FDBA5C', '#F97316'],
    features: [
      'Trip cancellation',
      'Medical emergency',
      'Baggage loss',
      'Flight delay cover',
    ],
    price: 899,
    priceUnit: '/trip',
    details: {
      'Policy Duration': '1 Trip',
      'Sum Insured': '₹10 Lakh',
      'Claim Settlement': '24 hours',
      'Network Hospitals': '5,000+',
    },
  },
  {
    id: 'personal-accident',
    icon: '🛡️',
    title: 'Personal Accident',
    description: 'Financial protection against accidental injury & disability',
    badge: 'Essential',
    color: '#8B5CF6',
    tint: '#ECEBFE',
    gradient: ['#A78BFA', '#7C3AED'],
    features: [
      'Accidental death cover',
      'Permanent disability',
      'Hospital cash benefit',
      'Family income protection',
    ],
    price: 1200,
    priceUnit: '/year',
    details: {
      'Policy Duration': '1 Year',
      'Sum Insured': '₹10 Lakh',
      'Claim Settlement': '24 hours',
      'Network Hospitals': '5,000+',
    },
  },
];

const InsuranceScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState(null);

  const selectedPolicy = POLICIES.find(p => p.id === selectedId) ?? null;

  // List — one Animated.Value per card, staggered in whenever the list
  // becomes the active view (first mount, or coming back from a detail page).
  const cardAnims = useRef(POLICIES.map(() => new Animated.Value(0))).current;

  // Detail — hero card + the fixed 4 stat rows animate in fresh each time a
  // different policy is opened.
  const heroAnim = useRef(new Animated.Value(0)).current;
  const rowAnims = useRef(
    Array.from({length: DETAIL_ROW_COUNT}, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (!selectedId) {
      cardAnims.forEach(anim => anim.setValue(0));
      Animated.stagger(
        70,
        cardAnims.map(anim =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ).start();
      return;
    }

    heroAnim.setValue(0);
    rowAnims.forEach(anim => anim.setValue(0));
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.stagger(
      60,
      rowAnims.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const handleBuy = useCallback(policy => {
    Alert.alert(
      `Buy ${policy.title}`,
      `${policy.title} starting from ₹${policy.price.toLocaleString('en-IN')}${policy.priceUnit}. Continue to checkout?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Continue', onPress: () => Alert.alert('Request received', "We'll be in touch to complete your purchase.")},
      ],
    );
  }, []);

  const handleTrackPolicy = useCallback(() => {
    Alert.alert('Track Existing Policy', 'Policy tracking is coming soon.');
  }, []);

  if (selectedPolicy) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.detailContent, {paddingTop: insets.top + 12}]}>
          <TouchableOpacity
            style={styles.backLink}
            activeOpacity={0.7}
            onPress={() => setSelectedId(null)}>
            <Icon name="chevron-back" size={16} color={selectedPolicy.color} />
            <Text style={[styles.backLinkText, {color: selectedPolicy.color}]}>
              Back to Policies
            </Text>
          </TouchableOpacity>

          <Animated.View
            style={{
              opacity: heroAnim,
              transform: [
                {scale: heroAnim.interpolate({inputRange: [0, 1], outputRange: [0.94, 1]})},
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            }}>
            <LinearGradient
              colors={selectedPolicy.gradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.heroCard}>
              <View style={styles.heroIconWrap}>
                <Text style={styles.heroIcon}>{selectedPolicy.icon}</Text>
              </View>
              <Text style={styles.heroTitle}>{selectedPolicy.title}</Text>
              <Text style={styles.heroDescription}>{selectedPolicy.description}</Text>

              <View style={styles.heroDivider} />

              <Text style={styles.heroPremiumLabel}>Annual Premium</Text>
              <Text style={styles.heroPremiumValue}>
                ₹{selectedPolicy.price.toLocaleString('en-IN')}
                <Text style={styles.heroPremiumUnit}>{selectedPolicy.priceUnit}</Text>
              </Text>
            </LinearGradient>
          </Animated.View>

          <View style={styles.detailsList}>
            {Object.entries(selectedPolicy.details).map(([label, value], index, arr) => (
              <Animated.View
                key={label}
                style={[
                  styles.detailRow,
                  index === arr.length - 1 && styles.detailRowLast,
                  {
                    opacity: rowAnims[index],
                    transform: [
                      {
                        translateX: rowAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [16, 0],
                        }),
                      },
                    ],
                  },
                ]}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </Animated.View>
            ))}
          </View>

          <ScaleTouchable
            style={[styles.buyButton, {backgroundColor: selectedPolicy.color}]}
            onPress={() => handleBuy(selectedPolicy)}>
            <Text style={styles.buyButtonText}>Buy {selectedPolicy.title}</Text>
          </ScaleTouchable>

          <ScaleTouchable
            style={[styles.trackButton, {borderColor: selectedPolicy.color}]}
            onPress={handleTrackPolicy}>
            <Text style={[styles.trackButtonText, {color: selectedPolicy.color}]}>
              Track Existing Policy
            </Text>
          </ScaleTouchable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.headerBackButton}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}>
          <Icon name="chevron-back" size={22} color={INK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insurance Services</Text>
        <View style={styles.headerBackButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        <Text style={styles.listSubtitle}>Choose the right protection for your needs</Text>

        {POLICIES.map((policy, index) => (
          <Animated.View
            key={policy.id}
            style={{
              opacity: cardAnims[index],
              transform: [
                {
                  translateY: cardAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
              ],
            }}>
          <ScaleTouchable
            style={styles.card}
            activeScale={0.98}
            onPress={() => setSelectedId(policy.id)}>
            <View style={styles.cardTopRow}>
              <View style={[styles.cardIconWrap, {backgroundColor: policy.tint}]}>
                <Text style={styles.cardIcon}>{policy.icon}</Text>
              </View>
              <View style={styles.cardTitleWrap}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{policy.title}</Text>
                  <View style={[styles.cardBadge, {backgroundColor: policy.color}]}>
                    <Text style={styles.cardBadgeText}>{policy.badge}</Text>
                  </View>
                </View>
                <Text style={styles.cardDescription}>{policy.description}</Text>
              </View>
            </View>

            <View style={styles.featuresGrid}>
              {policy.features.map(feature => (
                <View key={feature} style={styles.featureItem}>
                  <Icon name="checkmark-circle" size={13} color={policy.color} />
                  <Text style={styles.featureText} numberOfLines={1}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardFooterRow}>
              <View>
                <Text style={styles.startingFromLabel}>Starting from</Text>
                <Text style={[styles.priceValue, {color: policy.color}]}>
                  ₹{policy.price.toLocaleString('en-IN')}
                  <Text style={styles.priceUnit}>{policy.priceUnit}</Text>
                </Text>
              </View>
              <ScaleTouchable
                style={[styles.buyPolicyButton, {backgroundColor: policy.color}]}
                onPress={() => setSelectedId(policy.id)}>
                <Text style={styles.buyPolicyButtonText}>Buy Policy</Text>
              </ScaleTouchable>
            </View>
          </ScaleTouchable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },

  // List — header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  headerBackButton: {
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

  // List — content
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  listSubtitle: {
    fontSize: 13,
    color: GRAY,
    fontWeight: '500',
    marginBottom: 16,
  },

  // Policy card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
  },
  cardBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cardDescription: {
    fontSize: 12,
    color: GRAY,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 17,
  },

  // Features grid — 2 columns
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    rowGap: 8,
  },
  featureItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingRight: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },

  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
    marginTop: 14,
    marginBottom: 14,
  },

  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startingFromLabel: {
    fontSize: 10,
    color: GRAY,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  buyPolicyButton: {
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  buyPolicyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Detail screen
  detailContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 4,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },

  heroCard: {
    borderRadius: 22,
    padding: 22,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroIcon: {
    fontSize: 28,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 18,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.28)',
    marginTop: 18,
    marginBottom: 18,
  },
  heroPremiumLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  heroPremiumValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  heroPremiumUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },

  detailsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginTop: 18,
    paddingHorizontal: 18,
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 13,
    color: GRAY,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: INK,
    fontWeight: '700',
  },

  buyButton: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 22,
  },
  buyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackButton: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  trackButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default InsuranceScreen;
