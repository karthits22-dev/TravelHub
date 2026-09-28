import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import {isSameMonth, thisMonthMembers, useAmcState} from '../../Data/amcAgent';
import {
  MONTH_LONG,
  SLABS,
  formatINR,
  formatPhone,
  slabIndexFor,
} from '../../Utils/amcCommission';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const LIGHT_TEXT = '#9CA6A1';
const BORDER = '#E4DFD2';
const TINT_MINT = '#E1EEE8';
const ICON_MINT = '#1F6F5C';
const PEACH_BG = '#FCEEDD';
const PEACH_BORDER = '#F3D6B8';

const FILTERS = [
  {key: 'month', label: 'This month'},
  {key: 'all', label: 'All time'},
  {key: 'pending', label: 'Pending'},
];

const STATUS_META = {
  paid: {label: 'Paid', bg: '#E1EEE8', text: '#1F6F5C'},
  pending: {label: 'Pending', bg: '#FCEEDD', text: '#C2703D'},
  failed: {label: 'Failed', bg: '#FBE1E1', text: '#C23E3E'},
};

// Rotating avatar tints, picked by name so a member keeps theirs.
const AVATAR_TINTS = [
  {bg: '#E1EEE8', text: '#1F6F5C'},
  {bg: '#FCEEDD', text: '#C2703D'},
  {bg: '#FBE1E1', text: '#B04545'},
];

const DAY_MS = 86400000;

const initialsOf = name =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');

const tintFor = name =>
  AVATAR_TINTS[name.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % AVATAR_TINTS.length];

// "TODAY" / "THIS WEEK" / "EARLIER THIS MONTH" / "AUGUST 2026"
function sectionTitleFor(date, now) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date >= startOfToday) return 'TODAY';
  if (date >= startOfToday - 6 * DAY_MS) return 'THIS WEEK';
  if (isSameMonth(date, now)) return 'EARLIER THIS MONTH';
  return `${MONTH_LONG[date.getMonth()]} ${date.getFullYear()}`.toUpperCase();
}

const MemberRegistrationsScreen = ({navigation, route}) => {
  const amcState = useAmcState();
  const [filter, setFilter] = useState('month');
  const [query, setQuery] = useState('');
  const justRegisteredId = route?.params?.justRegisteredId;

  const justRegistered = useMemo(
    () => amcState.registrations.find(r => r.id === justRegisteredId),
    [amcState, justRegisteredId],
  );

  // Filter chip first (drives the stat cards), then search on top.
  const filtered = useMemo(() => {
    const now = new Date();
    if (filter === 'month') {
      return amcState.registrations.filter(r => isSameMonth(r.createdAt, now));
    }
    if (filter === 'pending') {
      return amcState.registrations.filter(r => r.status === 'pending');
    }
    return amcState.registrations;
  }, [amcState, filter]);

  const stats = useMemo(() => {
    const counted = filtered.filter(r => r.status !== 'failed');
    const monthCount = thisMonthMembers(amcState).length;
    return {
      members: counted.length,
      commission: counted.reduce((sum, r) => sum + r.commission, 0),
      // Tier the *next* registration will land in this month.
      currentTier: SLABS[slabIndexFor(monthCount + 1)].tierLabel,
    };
  }, [filtered, amcState]);

  const sections = useMemo(() => {
    const now = new Date();
    const q = query.trim().toLowerCase();
    const digits = q.replace(/[^0-9]/g, '');
    const matches = q
      ? filtered.filter(
          r => r.name.toLowerCase().includes(q) || (digits && r.phone.includes(digits)),
        )
      : filtered;

    const grouped = [];
    matches.forEach(r => {
      const title = sectionTitleFor(r.createdAt, now);
      const last = grouped[grouped.length - 1];
      if (last && last.title === title) last.data.push(r);
      else grouped.push({title, data: [r]});
    });
    return grouped;
  }, [filtered, query]);

  const renderItem = ({item}) => {
    const tint = tintFor(item.name);
    const status = STATUS_META[item.status];
    const isNew = item.id === justRegisteredId;
    return (
      <View
        style={[
          styles.row,
          item.status === 'failed' && styles.rowFailed,
          isNew && styles.rowNew,
        ]}>
        <View style={[styles.avatar, {backgroundColor: tint.bg}]}>
          <Text style={[styles.avatarText, {color: tint.text}]}>{initialsOf(item.name)}</Text>
        </View>
        <View style={styles.rowTextArea}>
          <Text style={styles.rowName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {formatPhone(item.phone)} · Tier {item.tierLabel}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.rowAmount}>{formatINR(item.commission)}</Text>
          <View style={[styles.statusPill, {backgroundColor: status.bg}]}>
            <Text style={[styles.statusText, {color: status.text}]}>{status.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  const listHeader = (
    <View>
      {justRegistered && (
        <View style={styles.successBanner}>
          <Icon name="checkmark-circle" size={18} color={ICON_MINT} />
          <Text style={styles.successText}>
            {justRegistered.name} registered as member #{justRegistered.memberNo} ·{' '}
            {formatINR(justRegistered.commission)} earned
          </Text>
        </View>
      )}

      <View style={styles.searchWrap}>
        <Icon name="search-outline" size={17} color={TEXT_MUTED} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or phone"
          placeholderTextColor={LIGHT_TEXT}
          returnKeyType="search"
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <Icon name="close-circle" size={17} color={LIGHT_TEXT} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.chips}>
        {FILTERS.map(f => {
          const active = f.key === filter;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.8}
              onPress={() => setFilter(f.key)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Members registered</Text>
          <Text style={styles.statValue}>{stats.members}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Current tier</Text>
          <Text style={styles.statValue}>{stats.currentTier}</Text>
        </View>
        <View style={[styles.statCard, styles.statCardPeach]}>
          <Text style={styles.statLabel}>Commission earned</Text>
          <Text style={styles.statValue}>{formatINR(stats.commission)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={18} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Registrations</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={({section}) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {query.trim() ? `No members match "${query.trim()}"` : 'No registrations yet.'}
          </Text>
        }
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('RegisterMember')}
        accessibilityLabel="Register a new member">
        <Icon name="add" size={28} color={CREAM} />
      </TouchableOpacity>
    </SafeAreaView>
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
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
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
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  listContent: {
    paddingHorizontal: 20,
    // Clears the FAB so the last row can scroll out from under it.
    paddingBottom: 96,
  },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: TINT_MINT,
  },
  successText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: ICON_MINT,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: TEXT_DARK,
  },

  chips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  chipActive: {
    backgroundColor: DEEP_GREEN,
    borderColor: DEEP_GREEN,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  chipTextActive: {
    color: CREAM,
  },

  stats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  statCardPeach: {
    backgroundColor: PEACH_BG,
    borderColor: PEACH_BORDER,
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: TEXT_MUTED,
  },
  statValue: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_DARK,
  },

  sectionHeader: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: TEXT_MUTED,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  rowFailed: {
    opacity: 0.55,
  },
  rowNew: {
    borderColor: ICON_MINT,
    borderWidth: 1.5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  rowTextArea: {
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rowAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 32,
    textAlign: 'center',
    fontSize: 13,
    color: TEXT_MUTED,
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DEEP_GREEN,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },
});

export default MemberRegistrationsScreen;
