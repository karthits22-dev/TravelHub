import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Modal,
  Pressable,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {DOCUMENT_TYPES, INITIAL_RENEWALS, getDocumentType} from '../../Data/renewalDocuments';
import {getRenewalStatus, renewalPillLabel, renewalSubtitle, STATUS_META} from '../../Utils/renewalStatus';

const INK = '#1B2E2A';
const GRAY = '#6E7D77';
const BORDER = '#E4DFD2';
const BG = '#F5F0E4';
const DEEP_GREEN = '#0F3D34';
const WHITE = '#FFFFFF';
const BANNER_BG = '#FCEEDD';
const BANNER_TEXT = '#8A5A2E';
const BANNER_ICON = '#C2703D';

const FILTERS = [
  {id: 'all', label: 'All'},
  {id: 'renewed', label: 'Renewed'},
  {id: 'lapsing', label: 'Lapsing soon'},
  {id: 'lapsed', label: 'Lapsed'},
];

// Shared press feedback — every tappable card springs down slightly on
// press and back up on release, matching the rest of the app's tactile feel.
const ScaleTouchable = ({style, onPress, children, activeScale = 0.97, ...rest}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {toValue: activeScale, useNativeDriver: true, speed: 50, bounciness: 0}).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8}).start();
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} {...rest}>
      <Animated.View style={[style, {transform: [{scale}]}]}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

const RenewalsScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const [renewals, setRenewals] = useState(INITIAL_RENEWALS);
  const [activeFilter, setActiveFilter] = useState('all');
  const [typePickerVisible, setTypePickerVisible] = useState(false);

  const cardAnims = useRef(renewals.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      60,
      cardAnims.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  // The form screen reports back via route params (savedAt changes on every
  // save, even a repeat edit, so this always re-fires) rather than a shared
  // store — there's no global state for this feature yet.
  useEffect(() => {
    const saved = route?.params?.savedRecord;
    if (!saved) return;

    setRenewals(prev => {
      const index = prev.findIndex(item => item.id === saved.id);
      if (index === -1) return [...prev, saved];
      const next = [...prev];
      next[index] = saved;
      return next;
    });
    navigation.setParams({savedRecord: undefined, savedAt: undefined});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.savedAt]);

  const visibleRenewals =
    activeFilter === 'all'
      ? renewals
      : renewals.filter(item => getRenewalStatus(item) === activeFilter);

  const openAddFlow = type => {
    setTypePickerVisible(false);
    navigation.navigate('RenewalForm', {typeId: type.id});
  };

  const openEditFlow = item => {
    navigation.navigate('RenewalForm', {typeId: item.typeId, record: item});
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.headerButton}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={18} color={DEEP_GREEN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Renewals & Reminders</Text>
        <TouchableOpacity
          style={[styles.headerButton, styles.addButton]}
          activeOpacity={0.85}
          onPress={() => setTypePickerVisible(true)}>
          <Icon name="add" size={20} color={WHITE} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.filterRow}>
          {FILTERS.map(filter => {
            const selected = filter.id === activeFilter;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(filter.id)}>
                <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.banner}>
          <Icon name="time-outline" size={16} color={BANNER_ICON} style={styles.bannerIcon} />
          <Text style={styles.bannerText}>
            Reminders go out weekly a month before expiry, then daily in the final week, via
            WhatsApp or SMS.
          </Text>
        </View>

        {visibleRenewals.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="document-text-outline" size={28} color={GRAY} />
            <Text style={styles.emptyStateText}>Nothing here yet</Text>
          </View>
        ) : (
          visibleRenewals.map((item, index) => {
            const type = getDocumentType(item.typeId);
            const {prefix, suffix, status, days} = renewalSubtitle(item, type);
            const meta = STATUS_META[status];
            const anim = cardAnims[index] ?? cardAnims[0];

            return (
              <Animated.View
                key={item.id}
                style={{
                  opacity: anim,
                  transform: [
                    {translateY: anim.interpolate({inputRange: [0, 1], outputRange: [16, 0]})},
                  ],
                }}>
                <ScaleTouchable style={styles.card} onPress={() => openEditFlow(item)}>
                  <View style={[styles.cardIconWrap, {backgroundColor: type.tint}]}>
                    <Icon name={type.icon} size={20} color={type.iconColor} />
                  </View>
                  <View style={styles.cardTextWrap}>
                    <Text style={styles.cardTitle}>{type.title}</Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      {prefix} · {suffix}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, {backgroundColor: meta.bg}]}>
                    <Text style={[styles.statusPillText, {color: meta.text}]}>
                      {renewalPillLabel(status, days)}
                    </Text>
                  </View>
                </ScaleTouchable>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={typePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTypePickerVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setTypePickerVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Track a document</Text>
            <Text style={styles.modalSubtitle}>Choose what you'd like to add a reminder for</Text>
            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
              bounces={false}>
              {DOCUMENT_TYPES.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.modalRow}
                  activeOpacity={0.7}
                  onPress={() => openAddFlow(type)}>
                  <View style={[styles.cardIconWrap, {backgroundColor: type.tint}]}>
                    <Icon name={type.icon} size={20} color={type.iconColor} />
                  </View>
                  <Text style={styles.modalRowText}>{type.title}</Text>
                  <Icon name="chevron-forward" size={16} color={GRAY} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: DEEP_GREEN,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: INK,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterChipSelected: {
    backgroundColor: DEEP_GREEN,
    borderColor: DEEP_GREEN,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: INK,
  },
  filterChipTextSelected: {
    color: WHITE,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: BANNER_BG,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  bannerIcon: {
    marginTop: 1,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: BANNER_TEXT,
    fontWeight: '500',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: INK,
  },
  cardSubtitle: {
    fontSize: 12,
    color: GRAY,
    fontWeight: '500',
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 0,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: GRAY,
    fontWeight: '600',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,61,52,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: INK,
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: GRAY,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 16,
  },
  modalList: {
    maxHeight: 360,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  modalRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
});

export default RenewalsScreen;
