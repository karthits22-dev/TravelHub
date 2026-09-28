import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import {DOCUMENT_TYPES, getDocumentType} from '../../Data/renewalDocuments';
import {parseDateKey, toDateKey} from '../Booking/BookingCalendar';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const INK = '#1B2E2A';
const GRAY = '#6E7D77';
const BORDER = '#E4DFD2';
const EYEBROW = '#C2703D';
const BANNER_BG = '#E1EEE8';
const BANNER_TEXT = '#1F6F5C';
const BANNER_ICON = '#1F6F5C';

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const formatFullDate = dateKey => {
  const {year, month, day} = parseDateKey(dateKey);
  return `${day} ${MONTH_SHORT[month]} ${year}`;
};

const dateKeyToLocalDate = dateKey => {
  if (!dateKey) return new Date();
  const {year, month, day} = parseDateKey(dateKey);
  return new Date(year, month, day);
};

const buildInitialValues = (type, record) => {
  const values = {};
  type.fields.forEach(field => {
    values[field.key] = record?.[field.key] ?? '';
  });
  return values;
};

const RenewalFormScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const existingRecord = route?.params?.record ?? null;
  const [typeId, setTypeId] = useState(route?.params?.typeId ?? DOCUMENT_TYPES[0].id);
  const type = getDocumentType(typeId);
  const [values, setValues] = useState(() => buildInitialValues(type, existingRecord));
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Only the "+" (add) flow lets you pick a type — an existing record's
  // type is fixed, but switching types while adding should reset the form
  // to that type's blank fields rather than keep mismatched values around.
  useEffect(() => {
    if (existingRecord) return;
    setValues(buildInitialValues(getDocumentType(typeId), null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeId]);

  const setField = (key, value) => setValues(prev => ({...prev, [key]: value}));

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    setField(
      'expiryDate',
      toDateKey(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()),
    );
  };

  const handleUpload = () => {
    Alert.alert('Upload document', 'Attaching photos or PDFs is coming soon.');
  };

  const handleSave = () => {
    const missing = type.fields.some(field => !String(values[field.key] ?? '').trim());
    if (missing) {
      Alert.alert('Missing details', 'Please fill in every field before saving.');
      return;
    }

    const record = {
      id: existingRecord?.id ?? `renewal-${typeId}-${Date.now()}`,
      typeId,
      ...values,
    };
    navigation.navigate('Renewals', {savedRecord: record, savedAt: Date.now()});
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={18} color={DEEP_GREEN} />
        </TouchableOpacity>

        <Text style={styles.eyebrow}>{type.category.toUpperCase()}</Text>
        <Text style={styles.title}>{type.title}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {!existingRecord && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typeSelectorScroll}
            contentContainerStyle={styles.typeSelectorRow}>
            {DOCUMENT_TYPES.map(option => {
              const selected = option.id === typeId;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.typeChip, selected && styles.typeChipSelected]}
                  activeOpacity={0.8}
                  onPress={() => setTypeId(option.id)}>
                  <Icon
                    name={option.icon}
                    size={13}
                    color={selected ? WHITE : option.iconColor}
                  />
                  <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                    {option.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.card}>
          {type.fields.map((field, index) => (
            <View
              key={field.key}
              style={[styles.fieldWrap, index === type.fields.length - 1 && styles.fieldWrapLast]}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              {field.type === 'date' ? (
                <TouchableOpacity
                  style={[styles.input, styles.dateInput]}
                  activeOpacity={0.75}
                  onPress={() => setShowDatePicker(true)}>
                  <Text style={[styles.inputText, !values[field.key] && styles.inputPlaceholder]}>
                    {values[field.key] ? formatFullDate(values[field.key]) : 'Select date'}
                  </Text>
                  <Icon name="calendar-outline" size={16} color={GRAY} />
                </TouchableOpacity>
              ) : (
                <TextInput
                  style={[styles.input, styles.inputText]}
                  placeholder={field.placeholder}
                  placeholderTextColor={GRAY}
                  value={values[field.key]}
                  onChangeText={text => setField(field.key, text)}
                />
              )}
            </View>
          ))}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dateKeyToLocalDate(values.expiryDate)}
            mode="date"
            onChange={onChangeDate}
          />
        )}

        <Text style={styles.uploadLabel}>Upload document (optional)</Text>
        <TouchableOpacity style={styles.uploadBox} activeOpacity={0.75} onPress={handleUpload}>
          <Icon name="cloud-upload-outline" size={22} color={GRAY} />
          <Text style={styles.uploadText}>Tap to upload a photo or PDF</Text>
        </TouchableOpacity>

        <View style={styles.banner}>
          <Icon name="time-outline" size={16} color={BANNER_ICON} style={styles.bannerIcon} />
          <Text style={styles.bannerText}>
            Reminders start automatically — weekly from 1 month before expiry, then daily in the
            final week, via WhatsApp or SMS.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomArea, {paddingBottom: insets.bottom + 16}]}>
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save & Track Renewal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },
  header: {
    paddingHorizontal: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: EYEBROW,
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: INK,
    marginTop: 4,
  },
  typeSelectorScroll: {
    marginTop: 16,
  },
  typeSelectorRow: {
    gap: 8,
    paddingRight: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  typeChipSelected: {
    backgroundColor: DEEP_GREEN,
    borderColor: DEEP_GREEN,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: INK,
  },
  typeChipTextSelected: {
    color: WHITE,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    marginTop: 18,
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  fieldWrap: {
    marginBottom: 16,
  },
  fieldWrapLast: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: EYEBROW,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: WHITE,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  inputPlaceholder: {
    fontWeight: '500',
    color: GRAY,
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
    marginTop: 20,
    marginBottom: 10,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
    gap: 8,
  },
  uploadText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: GRAY,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: BANNER_BG,
    borderRadius: 14,
    padding: 12,
    marginTop: 18,
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
  bottomArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: CREAM,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  saveButton: {
    backgroundColor: DEEP_GREEN,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: CREAM,
  },
});

export default RenewalFormScreen;
