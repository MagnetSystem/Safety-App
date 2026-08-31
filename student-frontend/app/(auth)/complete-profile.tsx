import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { GlassInput, ScreenHeader } from '../../src/components/ui-kit';
import { Screen } from '../../src/components/PhoneFrame';
import { colors, radius, spacing, typography, shadows } from '../../src/constants/theme';
import { updateMyProfile } from '../../src/services/studentsService';
import { ChevronRight, Check } from 'lucide-react-native';

export default function CompleteProfileScreen() {
  const router = useRouter();

  // Form State
  const [mobile, setMobile] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [isHosteler, setIsHosteler] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = 
    mobile.trim().length >= 10 &&
    studentNumber.trim().length > 0 &&
    department.trim().length > 0 &&
    emergencyContactName.trim().length > 0 &&
    emergencyContactPhone.trim().length >= 10 &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    
    try {
      await updateMyProfile({
        mobile: mobile.trim(),
        studentNumber: studentNumber.trim(),
        department: department.trim(),
        semester: semester.trim(),
        year: year ? parseInt(year.trim(), 10) : undefined,
        isHosteler,
        bloodGroup: bloodGroup.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
      });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not save your profile details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title="Complete Profile"
          subtitle="We need a few more details to keep you safe on campus."
        />

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Contact & Academic Info</Text>
          
          <GlassInput
            label="Mobile Phone Number *"
            placeholder="+91 90000 00000"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
          />
          
          <GlassInput
            label="Registration / Roll Number *"
            placeholder="SIT/CSE/2029/0147"
            value={studentNumber}
            onChangeText={setStudentNumber}
          />
          
          <GlassInput
            label="Department / Course *"
            placeholder="e.g. Computer Science"
            value={department}
            onChangeText={setDepartment}
          />
          
          <GlassInput
            label="Semester (Optional)"
            placeholder="e.g. 5"
            value={semester}
            onChangeText={setSemester}
          />

          <GlassInput
            label="Year of Study (Optional)"
            placeholder="e.g. 3"
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
          />

          <View style={{ marginTop: spacing.sm }}>
            <Text style={styles.label}>Residence Type</Text>
            <View style={styles.radioGroup}>
              <Pressable 
                style={[styles.radioOption, !isHosteler && styles.radioOptionActive]}
                onPress={() => setIsHosteler(false)}
              >
                <Text style={[styles.radioText, !isHosteler && styles.radioTextActive]}>Day Scholar</Text>
              </Pressable>
              <Pressable 
                style={[styles.radioOption, isHosteler && styles.radioOptionActive]}
                onPress={() => setIsHosteler(true)}
              >
                <Text style={[styles.radioText, isHosteler && styles.radioTextActive]}>Hosteler</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Emergency Information</Text>

          <GlassInput
            label="Emergency Contact Name *"
            placeholder="Parent or Guardian's Name"
            value={emergencyContactName}
            onChangeText={setEmergencyContactName}
          />

          <GlassInput
            label="Emergency Contact Phone *"
            placeholder="+91 90000 00000"
            value={emergencyContactPhone}
            onChangeText={setEmergencyContactPhone}
            keyboardType="phone-pad"
          />

          <GlassInput
            label="Blood Group (Optional)"
            placeholder="e.g. O+, A-, B+"
            value={bloodGroup}
            onChangeText={setBloodGroup}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.buttonText}>Complete Setup</Text>
                <Check size={20} color="#FFF" />
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  form: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 18,
    color: colors.indigoink,
    marginTop: spacing.sm,
  },
  label: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
    marginBottom: spacing.sm,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  radioOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  radioOptionActive: {
    backgroundColor: colors.lavenderTint,
    borderColor: colors.lavender,
  },
  radioText: {
    ...typography.body,
    color: colors.subink,
  },
  radioTextActive: {
    color: colors.indigoink,
    fontFamily: 'Inter_500Medium',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: spacing.md,
  },
  error: {
    ...typography.caption,
    color: '#C0433E',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.indigoink,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.soft,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
