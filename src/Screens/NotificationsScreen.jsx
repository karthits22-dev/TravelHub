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

const INK = '#0F172A';
const GRAY = '#64748B';
const BLUE = '#2F6FED';
const BG = '#F8FAFC';

const NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Booking Confirmed',
    description: 'Your hotel stay at The Nilgiri Retreat (Aug 10–12) is confirmed.',
    time: '2 min ago',
    accent: '#16A34A',
    iconBg: '#DCFCE7',
    icon: 'checkmark',
    iconColor: '#16A34A',
    unread: true,
  },
  {
    id: 'n2',
    title: 'Driver Assigned',
    description: 'Suresh Kumar (⭐ 4.9) will pick you up at 6:00 AM. KA 05 MG 4821',
    time: '15 min ago',
    accent: '#2563EB',
    iconBg: '#DBEAFE',
    icon: 'car',
    iconColor: '#2563EB',
    unread: true,
  },
  {
    id: 'n3',
    title: 'Payment Successful',
    description: 'Payment of ₹3,200 processed via UPI for The Nilgiri Retreat.',
    time: '1 hr ago',
    iconBg: '#DBEAFE',
    icon: 'card',
    iconColor: '#2563EB',
    unread: false,
  },
  {
    id: 'n4',
    title: 'Referral Reward!',
    description: 'Mohan Kumar completed 10 trips. You earned ₹200 referral bonus!',
    time: '3 hr ago',
    iconBg: '#FFEDD5',
    emoji: '🎁',
    unread: false,
  },
  {
    id: 'n5',
    title: 'Membership Renewal',
    description: 'Your driver membership expires in 30 days. Renew for ₹100.',
    time: '1 day ago',
    iconBg: '#EDE9FE',
    emoji: '🔔',
    unread: false,
  },
  {
    id: 'n6',
    title: 'Special Offer',
    description: 'Weekend deal: 15% OFF on homestays. Book now before it expires!',
    time: '2 days ago',
    iconBg: '#FEF9C3',
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
      StatusBar.setBackgroundColor('#FFFFFF');
      return () => {};
    }, []),
  );

  const handleMarkAllRead = useCallback(() => {
    setItems(prev => prev.map(item => ({...item, unread: false})));
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 24}]}>
        {items.map(item => (
          <View key={item.id} style={styles.card}>
            <View
              style={[
                styles.cardClip,
                item.unread && {backgroundColor: item.accent},
              ]}>
              <View style={[styles.cardInner, item.unread && styles.cardInnerUnread]}>
                <View style={[styles.iconWrap, {backgroundColor: item.iconBg}]}>
                  {item.emoji ? (
                    <Text style={styles.iconEmoji}>{item.emoji}</Text>
                  ) : (
                    <Icon name={item.icon} size={18} color={item.iconColor} />
                  )}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.unread && (
                      <View style={[styles.unreadDot, {backgroundColor: item.accent}]} />
                    )}
                  </View>
                  <Text style={styles.cardDescription}>{item.description}</Text>
                  <Text style={styles.cardTime}>{item.time}</Text>
                </View>
              </View>
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
    backgroundColor: BG,
  },

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
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: BLUE,
    paddingHorizontal: 8,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },

  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardClip: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 12,
  },
  cardInnerUnread: {
    marginLeft: 4,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 19,
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
    fontSize: 14.5,
    fontWeight: '700',
    color: INK,
    flexShrink: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardDescription: {
    fontSize: 12.5,
    color: GRAY,
    lineHeight: 18,
    marginTop: 4,
  },
  cardTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
});

export default NotificationsScreen;
