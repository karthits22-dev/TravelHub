import React, {useState, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
// RN's built-in SafeAreaView is a no-op on Android; this one actually
// measures real insets on both platforms (required now that Android 15+
// enforces edge-to-edge for all screens, not just ones that opt in).
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import {ALL_LISTINGS} from '../Data/listings';
import {useMembership} from '../Services/MembershipService';
import {PLAN_TOTAL, formatDate, formatINR} from '../Utils/amcCommission';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const BORDER = '#E4DFD2';
const TINT_PEACH = '#FBEAE0';
const ICON_PEACH = '#C2703D';
const TINT_MINT = '#E1EEE8';
const ICON_MINT = '#1F6F5C';
const SOON_BG = '#F3E4BE';
const SOON_TEXT = '#8A6D2E';
const MUTED_TINT = '#EAE6DA';
const MUTED_ICON = '#A4A79E';
const RENEWAL_BG = '#FBE3D2';
const RENEWAL_TITLE = '#7A4B24';
const RENEWAL_SUBTITLE = '#9C7654';

const SERVICES = [
  {id: 'cabs', label: 'Cabs & Auto', iconLib: 'material', icon: 'local-taxi', tint: TINT_PEACH, iconColor: ICON_PEACH, route: 'Taxi'},
  {id: 'hotels', label: 'Hotels & Stays', iconLib: 'ion', icon: 'home-outline', tint: TINT_MINT, iconColor: ICON_MINT, route: 'AllHotels'},
  {id: 'restaurants', label: 'Restaurants', iconLib: 'ion', icon: 'restaurant-outline', tint: TINT_PEACH, iconColor: ICON_PEACH},
  {id: 'catering', label: 'Food Catering', iconLib: 'ion', icon: 'briefcase-outline', tint: TINT_PEACH, iconColor: ICON_PEACH},
  {id: 'renewals', label: ' Renewals & Reminders', iconLib: 'ion', icon: 'shield-outline', tint: TINT_MINT, iconColor: ICON_MINT, route: 'Renewals'},
  {id: 'banking', label: 'Banking', iconLib: 'ion', icon: 'card-outline', tint: TINT_MINT, iconColor: ICON_MINT, soon: true},
];

const HomeScreen = ({navigation}) => {
  const [query, setQuery] = useState('');
  const membership = useMembership();
  const isMember = membership.active;

  const trimmedQuery = query.trim().toLowerCase();
  const searchResults = trimmedQuery
    ? ALL_LISTINGS.filter(
        item =>
          item.name.toLowerCase().includes(trimmedQuery) ||
          item.location.toLowerCase().includes(trimmedQuery) ||
          item.categoryLabel.toLowerCase().includes(trimmedQuery),
      )
    : [];

  // Bottom-tab screens stay mounted after their first visit, so a plain
  // <StatusBar> here would keep winning even after the user switches to
  // another tab. useFocusEffect applies this only while Home is active and
  // restores the app's default when it isn't.
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor(CREAM);
      return () => {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('#FFFFFF');
        // Clear the search so returning to Home (e.g. after tapping a
        // result) shows the normal dashboard again, not stale results.
        setQuery('');
      };
    }, []),
  );

  const searchKeyExtractor = useCallback(
    item => `${item.categoryId}-${item.id}`,
    [],
  );

  const renderSearchResult = useCallback(
    ({item}) => (
      <TouchableOpacity
        style={styles.searchResultCard}
        activeOpacity={0.85}
        onPress={() =>
          navigation?.navigate?.(item.route, {id: item.id, categoryId: item.categoryId})
        }>
        <Image source={{uri: item.image}} style={styles.searchResultImage} />
        <View style={styles.searchResultInfo}>
          <View style={styles.searchCategoryPill}>
            <Text style={styles.searchCategoryPillText}>{item.categoryLabel}</Text>
          </View>
          <Text style={styles.searchResultName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.searchResultMetaRow}>
            <Icon name="location-outline" size={12} color={TEXT_MUTED} />
            <Text style={styles.searchResultLocation} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        </View>
        <View style={styles.searchResultRatingRow}>
          <Icon name="star" size={12} color="#F59E0B" />
          <Text style={styles.searchResultRating}>{item.rating}</Text>
        </View>
      </TouchableOpacity>
    ),
    [navigation],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.name}>Sharma</Text>
        </View>
        <TouchableOpacity
          style={styles.bellButton}
          activeOpacity={0.7}
          onPress={() => navigation?.navigate?.('Notifications')}>
          <Icon name="notifications-outline" size={20} color={DEEP_GREEN} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchCard}>
        <Icon name="search" size={18} color={TEXT_MUTED} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search hotels, cabs, insurance..."
          placeholderTextColor={TEXT_MUTED}
          style={styles.searchInput}
        />
        {trimmedQuery ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Icon name="close-circle" size={18} color={TEXT_MUTED} />
          </TouchableOpacity>
        ) : null}
      </View>

      {trimmedQuery ? (
        <FlatList
          data={searchResults}
          keyExtractor={searchKeyExtractor}
          renderItem={renderSearchResult}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.searchResultsContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.searchEmptyText}>
              No results for "{query.trim()}"
            </Text>
          }
        />
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.amcCard}
            activeOpacity={0.85}
            onPress={() =>
              navigation?.navigate?.(isMember ? 'Membership' : 'ActivateMembership')
            }>
            <View style={styles.amcTextArea}>
              <Text style={styles.amcLabel}>AMC MEMBERSHIP</Text>
              {isMember ? (
                <>
                  <Text style={styles.amcValue}>
                    Active · {formatINR(PLAN_TOTAL)} / year
                  </Text>
                  <Text style={styles.amcSubtext}>
                    Renews {formatDate(membership.renewsOn)} · Tap to view commissions
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.amcValue}>Not active</Text>
                  <Text style={styles.amcSubtext}>
                    Activate for {formatINR(PLAN_TOTAL)} / year to unlock every service
                  </Text>
                </>
              )}
            </View>
            <Icon name="chevron-forward" size={20} color={CREAM} />
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Services</Text>

          <View style={styles.servicesGrid}>
            {SERVICES.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.serviceTile}
                activeOpacity={item.soon ? 1 : 0.75}
                disabled={item.soon}
                onPress={() => item.route && navigation?.navigate?.(item.route)}>
                {item.soon ? (
                  <View style={styles.soonBadge}>
                    <Text style={styles.soonBadgeText}>SOON</Text>
                  </View>
                ) : null}
                <View
                  style={[
                    styles.serviceIconWrap,
                    {backgroundColor: item.soon ? MUTED_TINT : item.tint},
                  ]}>
                  {item.iconLib === 'material' ? (
                    <MaterialIcon
                      name={item.icon}
                      size={22}
                      color={item.soon ? MUTED_ICON : item.iconColor}
                    />
                  ) : (
                    <Icon
                      name={item.icon}
                      size={22}
                      color={item.soon ? MUTED_ICON : item.iconColor}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.serviceLabel,
                    item.soon && styles.serviceLabelMuted,
                  ]}
                 // numberOfLines={1}
                  adjustsFontSizeToFit>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.renewalBanner}>
            <Icon name="time-outline" size={20} color={ICON_PEACH} />
            <View style={styles.renewalTextArea}>
              <Text style={styles.renewalTitle}>2 renewals due this month</Text>
              <Text style={styles.renewalSubtitle}>
                Vehicle insurance & fitness certificate
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_MUTED,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: DEEP_GREEN,
    marginTop: 2,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F97316',
  },

  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: WHITE,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT_DARK,
    padding: 0,
  },

  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
  },

  amcCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DEEP_GREEN,
    borderRadius: 22,
    padding: 20,
    marginTop: 18,
  },
  amcTextArea: {
    flex: 1,
  },
  amcLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(245,240,228,0.65)',
  },
  amcValue: {
    fontSize: 20,
    fontWeight: '800',
    color: CREAM,
    marginTop: 6,
  },
  amcSubtext: {
    fontSize: 12,
    color: 'rgba(245,240,228,0.65)',
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
    marginTop: 26,
    marginBottom: 14,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  serviceTile: {
    width: '31.5%',
    backgroundColor: WHITE,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceLabel: {
    fontSize:13,
    fontWeight: '700',
    color: TEXT_DARK,
    marginTop: 12,
    textAlign: 'center',
  },
  serviceLabelMuted: {
    color: TEXT_MUTED,
  },
  soonBadge: {
    position: 'absolute',
    // Sits above the tile's own top edge (in the row gap) instead of over
    // the centered icon below it — at this tile width the icon takes up
    // too much of the card for a corner badge to avoid overlapping it.
    top: -8,
    right: 8,
    backgroundColor: SOON_BG,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: WHITE,
  },
  soonBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: SOON_TEXT,
    letterSpacing: 0.3,
  },

  renewalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: RENEWAL_BG,
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  renewalTextArea: {
    flex: 1,
  },
  renewalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: RENEWAL_TITLE,
  },
  renewalSubtitle: {
    fontSize: 12,
    color: RENEWAL_SUBTITLE,
    marginTop: 2,
  },

  // Search results
  searchResultsContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 12,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 10,
    gap: 12,
  },
  searchResultImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    flexShrink: 0,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: TINT_MINT,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  searchCategoryPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: ICON_MINT,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
    marginTop: 4,
  },
  searchResultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  searchResultLocation: {
    flex: 1,
    fontSize: 11,
    color: TEXT_MUTED,
  },
  searchResultRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchResultRating: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  searchEmptyText: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 13,
    color: TEXT_MUTED,
  },
});

export default HomeScreen;
