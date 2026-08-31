import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Modal, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Glass, GlassInput, ScreenHeader } from '../../src/components/ui-kit';
import { Screen } from '../../src/components/PhoneFrame';
import { colors, radius, spacing, typography, shadows } from '../../src/constants/theme';
import { useAuth } from '../../src/store/AuthContext';
import { getPublicColleges, PublicCollege } from '../../src/services/collegesService';
import { ChevronRight, ChevronLeft, Check, Search, X, Building2 } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [colleges, setColleges] = useState<PublicCollege[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [collegeId, setCollegeId] = useState<string | null>(null);

  // College Picker Modal State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getPublicColleges()
      .then((list) => {
        setColleges(list);
      })
      .catch(() => setError('Could not load the list of colleges. Pull down to try again.'))
      .finally(() => setCollegesLoading(false));
  }, []);

  const filteredColleges = useMemo(() => {
    if (!searchQuery) return colleges;
    const lowerQuery = searchQuery.toLowerCase();
    return colleges.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) || 
      c.code.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery, colleges]);

  const selectedCollege = colleges.find(c => c.id === collegeId);

  const step1Valid = name.trim().length > 1 && email.trim().length > 0 && password.length >= 8;
  const step2Valid = !!collegeId;
  const canSubmit = step1Valid && step2Valid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !collegeId) return;
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        collegeId,
      });
      router.replace('/(auth)/complete-profile' as any);
    } catch (err: any) {
      setError(err.message ?? 'Could not create your account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title="Create account"
          subtitle={step === 1 ? "Step 1: Your details" : "Step 2: Choose your College"}
          back={step === 1 ? "/(auth)/login" : undefined}
          onBack={step === 2 ? () => setStep(1) : undefined}
        />

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, step >= 1 ? styles.progressActive : {}]} />
          <View style={[styles.progressBar, step >= 2 ? styles.progressActive : {}]} />
        </View>

        <View style={styles.form}>
          {step === 1 && (
            <>
              <GlassInput label="Full name" placeholder="Aarav Mehta" value={name} onChangeText={setName} />
              <GlassInput
                label="Email"
                placeholder="you@college.edu"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <GlassInput
                label="Password"
                placeholder="At least 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Pressable
                style={[styles.button, !step1Valid && styles.buttonDisabled]}
                onPress={() => step1Valid && setStep(2)}
                disabled={!step1Valid}
              >
                <Text style={styles.buttonText}>Next</Text>
                <ChevronRight size={20} color="#FFF" />
              </Pressable>
            </>
          )}

          {step === 2 && (
            <>
              <View>
                <Text style={styles.label}>Which college do you attend?</Text>
                
                <Pressable 
                  style={styles.dropdownTrigger}
                  onPress={() => setIsPickerOpen(true)}
                >
                  <View style={styles.dropdownContent}>
                    <Building2 size={20} color={selectedCollege ? colors.indigoink : colors.mutedink} />
                    <Text style={[styles.dropdownText, !selectedCollege && styles.dropdownPlaceholder]}>
                      {selectedCollege ? selectedCollege.name : 'Tap to search colleges...'}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.subink} />
                </Pressable>

                {collegesLoading && (
                  <ActivityIndicator color={colors.indigoink} style={styles.collegeLoading} />
                )}
              </View>

              <Text style={styles.noticeText}>
                You will be able to complete the rest of your profile (like Phone Number and Registration ID) after you log in.
              </Text>

              {error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.button, styles.backButton]}
                  onPress={() => setStep(1)}
                  disabled={submitting}
                >
                  <ChevronLeft size={20} color={colors.indigoink} />
                  <Text style={[styles.buttonText, { color: colors.indigoink }]}>Back</Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.submitButton, !canSubmit && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Create Account</Text>
                      <Check size={20} color="#FFF" />
                    </>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Full Screen College Search Modal */}
      <Modal visible={isPickerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsPickerOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select College</Text>
            <Pressable onPress={() => setIsPickerOpen(false)} style={styles.closeButton}>
              <X size={24} color={colors.ink} />
            </Pressable>
          </View>
          
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.subink} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search by name or code..."
              placeholderTextColor={colors.mutedink}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color={colors.mutedink} />
              </Pressable>
            )}
          </View>

          <FlatList 
            data={filteredColleges}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable 
                style={[styles.collegeItem, collegeId === item.id && styles.collegeItemActive]}
                onPress={() => {
                  setCollegeId(item.id);
                  setIsPickerOpen(false);
                  setSearchQuery('');
                }}
              >
                <View style={styles.collegeInfo}>
                  <Text style={[styles.collegeName, collegeId === item.id && styles.collegeNameActive]}>{item.name}</Text>
                  <Text style={styles.collegeCode}>{item.code}</Text>
                </View>
                {collegeId === item.id && <Check size={20} color={colors.indigoink} />}
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No colleges found matching "{searchQuery}"</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
    paddingHorizontal: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: colors.indigoink,
  },
  form: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  label: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
    marginBottom: spacing.md,
  },
  noticeText: {
    ...typography.caption,
    color: colors.mutedink,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  collegeLoading: {
    marginTop: spacing.sm,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...shadows.soft,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdownText: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: colors.mutedink,
  },
  error: {
    ...typography.caption,
    color: '#C0433E',
    textAlign: 'center',
    marginTop: spacing.lg,
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
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    flex: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    ...typography.h3,
    fontSize: 20,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: spacing.lg,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    height: 50,
    ...shadows.soft,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    height: '100%',
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  collegeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  collegeItemActive: {
    backgroundColor: colors.lavenderTint,
    borderColor: colors.lavender,
    borderWidth: 1,
  },
  collegeInfo: {
    flex: 1,
  },
  collegeName: {
    ...typography.body,
    fontFamily: 'Inter_500Medium',
    color: colors.ink,
    marginBottom: 4,
  },
  collegeNameActive: {
    color: colors.indigoink,
  },
  collegeCode: {
    ...typography.caption,
    color: colors.subink,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.subink,
    textAlign: 'center',
  },
});
