import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const TINT_MINT = '#E1EEE8';
const ICON_MINT = '#1F6F5C';
const TINT_PEACH = '#FBEAE0';
const ICON_PEACH = '#C2703D';

const NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Booking Confirmed',
    description: 'Your hotel stay at The Nilgiri Retreat (Aug 10–12) is confirmed.',
    time: '2 min ago',
    iconBg: TINT_MINT,
    icon: 'checkmark',
    iconColor: ICON_MINT,
    unread: true,
  },
  {
    id: 'n2',
    title: 'Driver Assigned',
    description: 'Suresh Kumar (⭐ 4.9) will pick you up at 6:00 AM. KA 05 MG 4821',
    time: '15 min ago',
    iconBg: TINT_MINT,
    icon: 'car',
    iconColor: ICON_MINT,
    unread: true,
  },
  {
    id: 'n3',
    title: 'Payment Successful',
    description: 'Payment of ₹3,200 processed via UPI for The Nilgiri Retreat.',
    time: '1 hr ago',
    iconBg: TINT_MINT,
    icon: 'card',
    iconColor: ICON_MINT,
    unread: false,
  },
  {
    id: 'n4',
    title: 'Referral Reward!',
    description: 'Mohan Kumar completed 10 trips. You earned ₹200 referral bonus!',
    time: '3 hr ago',
    iconBg: TINT_PEACH,
    emoji: '🎁',
    unread: false,
  },
  {
    id: 'n5',
    title: 'Membership Renewal',
    description: 'Your AMC membership expires in 30 days. Renew for ₹118.',
    time: '1 day ago',
    iconBg: TINT_PEACH,
    emoji: '🔔',
    unread: false,
  },
  {
    id: 'n6',
    title: 'Special Offer',
    description: 'Weekend deal: 15% OFF on homestays. Book now before it expires!',
    time: '2 days ago',
    iconBg: TINT_PEACH,
    emoji: '🏷️',
    unread: false,
  },
];

const NotificationsScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState(NOTIFICATIONS);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor(CREAM);
      return () => {};
    }, []),
  );

  const handleMarkAllRead = useCallback(() => {
    setItems(prev => prev.map(item => ({...item, unread: false})));
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}>
          <Icon name="chevron-back" size={17} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 24}]}>
        {items.map(item => (
          <View key={item.id} style={[styles.card, item.unread && styles.cardUnread]}>
            <View style={[styles.iconWrap, {backgroundColor: item.iconBg}]}>
              {item.emoji ? (
                <Text style={styles.iconEmoji}>{item.emoji}</Text>
              ) : (
                <Icon name={item.icon} size={17} color={item.iconColor} />
              )}
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.unread && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.cardDescription}>{item.description}</Text>
              <Text style={styles.cardTime}>{item.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  markAllText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: DEEP_GREEN,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 10,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 15,
    padding: 12,
    gap: 11,
  },
  cardUnread: {
    backgroundColor: TINT_MINT,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 17,
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_DARK,
    flexShrink: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: DEEP_GREEN,
  },
  cardDescription: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    lineHeight: 17,
    marginTop: 3,
  },
  cardTime: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    marginTop: 5,
  },
});

export default NotificationsScreen;
