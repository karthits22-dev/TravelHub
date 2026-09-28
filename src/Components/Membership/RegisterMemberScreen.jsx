import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import {
  AGENT,
  registerMember,
  thisMonthMembers,
  useAmcState,
} from '../../Data/amcAgent';
import {
  PLAN,
  PLAN_GST,
  PLAN_TOTAL,
  SLABS,
  commissionFor,
  formatINR,
  slabIndexFor,
} from '../../Utils/amcCommission';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const LIGHT_TEXT = '#9CA6A1';
const BORDER = '#E4DFD2';
const ERROR_RED = '#C23E3E';
const PEACH_BG = '#FCEEDD';
const PEACH_BORDER = '#F3D6B8';
const PEACH_TEXT = '#C2703D';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

const RegisterMemberScreen = ({navigation}) => {
  const amcState = useAmcState();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  // Errors only show after the first submit attempt, so the form doesn't
  // open covered in red.
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nextMemberNo = useMemo(
    () => thisMonthMembers(amcState).length + 1,
    [amcState],
  );
  const nextSlab = SLABS[slabIndexFor(nextMemberNo)];
  const nextCommission = commissionFor(nextMemberNo, AGENT.cycleMonth);

  const errors = useMemo(() => {
    const e = {};
    if (name.trim().length < 2) e.name = "Enter the member's full name.";
    if (!PHONE_RE.test(phone)) {
      e.phone = 'Enter a valid 10-digit mobile number.';
    } else if (
      amcState.registrations.some(r => r.phone === phone && r.status !== 'failed')
    ) {
      e.phone = 'This number is already registered.';
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email or leave it blank.';
    if (address.trim().length < 3) e.address = 'Enter the city and state.';
    return e;
  }, [name, phone, email, address, amcState]);
  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = () => {
    setAttempted(true);
    if (!isValid || submitting) return;
    setSubmitting(true);
    // No payment backend yet — mirrors the short simulated delay used by
    // the other checkout flows until a real one exists.
    setTimeout(() => {
      const record = registerMember({
        name: name.trim(),
        phone,
        email: email.trim(),
        address: address.trim(),
      });
      // popTo returns to My Registrations if it's already in the stack
      // (opened via its + button), or replaces this screen with it if not,
      // so back from there always lands on the dashboard.
      navigation.popTo('MemberRegistrations', {justRegisteredId: record.id});
    }, 600);
  };

  const renderField = ({label, value, onChangeText, error, prefix, ...inputProps}) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, attempted && error && styles.inputWrapError]}>
        {prefix ? <Text style={styles.inputPrefix}>{prefix}</Text> : null}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={LIGHT_TEXT}
          editable={!submitting}
          {...inputProps}
        />
      </View>
      {attempted && error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />
      {/* padding, not the manifest's adjustResize: edge-to-edge on
          Android 15+ stops the window resizing for the keyboard. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={18} color={TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Register New Member</Text>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.agentBanner}>
            <View style={styles.agentAvatar}>
              <Icon name="person-outline" size={16} color={CREAM} />
            </View>
            <View>
              <Text style={styles.agentTitle}>Registering as {AGENT.name}</Text>
              <Text style={styles.agentSubtitle}>Agent code {AGENT.code}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Member details</Text>
            {renderField({
              label: 'Full name',
              value: name,
              onChangeText: setName,
              error: errors.name,
              placeholder: "Enter member's name",
              autoCapitalize: 'words',
              textContentType: 'name',
            })}
            {renderField({
              label: 'Phone number',
              value: phone,
              onChangeText: text => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10)),
              error: errors.phone,
              prefix: '+91',
              placeholder: '98450 12345',
              keyboardType: 'number-pad',
              maxLength: 10,
            })}
            {renderField({
              label: 'Email (optional)',
              value: email,
              onChangeText: setEmail,
              error: errors.email,
              placeholder: 'name@email.com',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
              autoCorrect: false,
            })}
            {renderField({
              label: 'Address',
              value: address,
              onChangeText: setAddress,
              error: errors.address,
              placeholder: 'City, State',
              autoCapitalize: 'words',
            })}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>AMC plan</Text>
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Base AMC</Text>
              <Text style={styles.planValue}>{formatINR(PLAN.base)}</Text>
            </View>
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>
                GST ({Math.round(PLAN.gstRate * 100)}%)
              </Text>
              <Text style={styles.planValue}>{formatINR(PLAN_GST)}</Text>
            </View>
            <View style={styles.planTotalRow}>
              <Text style={styles.planTotalLabel}>Total payable</Text>
              <Text style={styles.planTotalValue}>{formatINR(PLAN_TOTAL)}</Text>
            </View>
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>COMMISSION PREVIEW</Text>
            <Text style={styles.previewTitle}>
              This will be member #{nextMemberNo} this month
            </Text>
            <Text style={styles.previewText}>
              Falls in the {nextSlab.tierLabel} tier · you earn{' '}
              {formatINR(nextCommission)} for this registration
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, attempted && !isValid && styles.submitButtonDisabled]}
            activeOpacity={0.85}
            disabled={submitting}
            onPress={handleSubmit}>
            {submitting ? (
              <ActivityIndicator size="small" color={CREAM} />
            ) : (
              <Text style={styles.submitButtonText}>
                Register & Collect {formatINR(PLAN_TOTAL)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  bodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  agentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: DEEP_GREEN,
  },
  agentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,240,228,0.15)',
  },
  agentTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: CREAM,
  },
  agentSubtitle: {
    marginTop: 2,
    fontSize: 11.5,
    color: 'rgba(245,240,228,0.75)',
  },

  card: {
    marginTop: 14,
    padding: 16,
    backgroundColor: WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  field: {
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: WHITE,
    paddingHorizontal: 12,
  },
  inputWrapError: {
    borderColor: ERROR_RED,
  },
  inputPrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: TEXT_DARK,
  },
  errorText: {
    marginTop: 4,
    fontSize: 11.5,
    fontWeight: '600',
    color: ERROR_RED,
  },

  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  planLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  planValue: {
    fontSize: 13,
    color: TEXT_DARK,
  },
  planTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  planTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  planTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: DEEP_GREEN,
  },

  previewCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: PEACH_BG,
    borderWidth: 1,
    borderColor: PEACH_BORDER,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: PEACH_TEXT,
  },
  previewTitle: {
    marginTop: 4,
    fontSize: 14.5,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  previewText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_MUTED,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  submitButton: {
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: DEEP_GREEN,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: CREAM,
  },
});

export default RegisterMemberScreen;
