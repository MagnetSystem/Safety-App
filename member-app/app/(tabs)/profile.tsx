import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { HeartPulse, Edit2, Check, X, Download, Trash2 } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { Glass, ScreenHeader, GlassInput } from '../../src/components/ui-kit';
import {
  getMyProfile, updateMyProfile, exportMyData, deleteMyAccount, joinOrganization,
} from '../../src/services/membersService';
import { changePassword } from '../../src/services/authService';
import { inviteGuardian, listMyGuardians, acceptGuardianCode } from '../../src/services/guardiansService';
import type { StudentProfile } from '../../src/types';
import { colors, radius, spacing, typography } from '../../src/constants/theme';
import { useAuth } from '../../src/store/AuthContext';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const NOT_SET = 'Not set';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    mobile: '',
    studentNumber: '',
    department: '',
    course: '',
    semester: '',
    year: '',
    isHosteler: false,
    bloodGroup: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const loadProfile = () => {
    setLoading(true);
    getMyProfile()
      .then((p) => {
        setProfile(p);
        setFormData({
          mobile: p.mobile || '',
          studentNumber: p.studentNumber || '',
          department: p.department || '',
          course: p.course || '',
          semester: p.semester || '',
          year: p.year?.toString() || '',
          isHosteler: p.isHosteler || false,
          bloodGroup: p.bloodGroup || '',
          emergencyContactName: p.emergencyContactName || '',
          emergencyContactPhone: p.emergencyContactPhone || '',
        });
        setError(null);
        listMyGuardians().then(setGuardians).catch(() => undefined);
      })
      .catch(() => setError('Could not load your profile.'))
      .finally(() => setLoading(false));
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const [busy, setBusy] = useState<null | 'export' | 'delete'>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [guardianCode, setGuardianCode] = useState<string | null>(null);
  const [acceptCode, setAcceptCode] = useState('');
  const [guardians, setGuardians] = useState<{ id: string; status: string; guardian: { email: string } | null }[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Re-enter the new password.');
      return;
    }
    setPasswordBusy(true);
    setPasswordMsg(null);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg('Password updated.');
    } catch (err: any) {
      Alert.alert('Could not change password', err?.response?.data?.message ?? 'Check your current password.');
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleExport = async () => {
    setBusy('export');
    try {
      const data = await exportMyData();
      const file = new File(Paths.cache, `safety-platform-data-${Date.now()}.json`);
      file.write(JSON.stringify(data, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
      } else {
        Alert.alert('Export ready', `Saved to ${file.uri}`);
      }
    } catch {
      Alert.alert('Could not export', 'Please try again in a moment.');
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      'Your profile and personal details are permanently removed. Reports you filed are kept for the committee but no longer linked to you. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusy('delete');
            try {
              await deleteMyAccount();
              await logout();
              router.replace('/(auth)/login');
            } catch {
              setBusy(null);
              Alert.alert('Could not delete', 'Please try again in a moment.');
            }
          },
        },
      ],
    );
  };
  
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMyProfile({
        ...formData,
        year: formData.year ? parseInt(formData.year, 10) : undefined,
      });
      setProfile(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to current profile
    if (profile) {
      setFormData({
        mobile: profile.mobile || '',
        studentNumber: profile.studentNumber || '',
        department: profile.department || '',
        course: profile.course || '',
        semester: profile.semester || '',
        year: profile.year?.toString() || '',
        isHosteler: profile.isHosteler || false,
        bloodGroup: profile.bloodGroup || '',
        emergencyContactName: profile.emergencyContactName || '',
        emergencyContactPhone: profile.emergencyContactPhone || '',
      });
    }
  };

  if (loading) {
    return (
      <Screen padded>
        <ActivityIndicator color={colors.indigoink} style={styles.loading} />
      </Screen>
    );
  }

  const name = profile?.name ?? 'Student';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Profile</Text>
          {!isEditing && (
            <Pressable onPress={() => setIsEditing(true)} style={styles.editButton}>
              <Edit2 size={18} color={colors.indigoink} />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          )}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials || '?'}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.college}>{profile?.college?.name ?? profile?.organization?.name ?? 'No organization yet'}</Text>
        </View>

        {!isEditing ? (
          // VIEW MODE
          <>
            <Glass style={styles.detailsCard}>
              <Text style={styles.sectionHeader}>Academic & Contact Details</Text>
              <View style={styles.divider} />
              <Row label="Mobile" value={profile?.mobile ?? NOT_SET} />
              <View style={styles.divider} />
              <Row label="Roll number" value={profile?.studentNumber ?? NOT_SET} />
              <View style={styles.divider} />
              <Row label="Email" value={profile?.user?.email ?? NOT_SET} />
              <View style={styles.divider} />
              <Row label="Department" value={profile?.department ?? NOT_SET} />
              <View style={styles.divider} />
              <Row label="Course" value={profile?.course ?? NOT_SET} />
              <View style={styles.divider} />
              <Row label="Semester" value={profile?.semester ?? NOT_SET} />
              <View style={styles.divider} />
              <Row label="Year" value={profile?.year?.toString() ?? NOT_SET} />
              <View style={styles.divider} />
              <Row label="Residence" value={profile?.isHosteler ? 'Hosteler' : 'Day Scholar'} />
            </Glass>

            <Glass style={styles.medicalCard}>
              <View style={styles.medicalHeader}>
                <HeartPulse size={18} strokeWidth={1.8} color={colors.indigoink} />
                <Text style={styles.medicalTitle}>Emergency medical info</Text>
              </View>
              <Text style={styles.medicalDesc}>
                Shared only when you send an emergency alert.
              </Text>
              <View style={styles.medicalContent}>
                <Row label="Emergency Contact" value={profile?.emergencyContactName ?? NOT_SET} />
                <View style={styles.divider} />
                <Row label="Emergency Phone" value={profile?.emergencyContactPhone ?? NOT_SET} />
                <View style={styles.divider} />
                <Row label="Blood group" value={profile?.bloodGroup ?? NOT_SET} />
              </View>
            </Glass>

            <Glass style={styles.detailsCard}>
              <Text style={styles.sectionHeader}>Organization &amp; Guardian</Text>
              <View style={styles.divider} />
              {!(profile?.organizationId || profile?.college?.id) && (
                <>
                  <GlassInput label="Join code" placeholder="DEMOJOIN" value={joinCode} onChangeText={(t) => setJoinCode(t.toUpperCase())} autoCapitalize="characters" />
                  <Pressable
                    style={styles.signOutBtn}
                    disabled={joining || joinCode.length < 4}
                    onPress={async () => {
                      setJoining(true);
                      try {
                        await joinOrganization(joinCode.trim());
                        loadProfile();
                      } catch (err: any) {
                        Alert.alert('Could not join', err?.response?.data?.message ?? 'Check the join code.');
                      } finally {
                        setJoining(false);
                      }
                    }}
                  >
                    <Text style={styles.signOutText}>{joining ? 'Joining…' : 'Join organization'}</Text>
                  </Pressable>
                  <View style={styles.divider} />
                </>
              )}
              <Pressable
                style={styles.privacyRow}
                onPress={async () => {
                  try {
                    const invited = await inviteGuardian();
                    setGuardianCode(invited.code);
                  } catch {
                    Alert.alert('Could not create invite');
                  }
                }}
              >
                <Text style={styles.privacyRowText}>Invite a Guardian</Text>
              </Pressable>
              {guardianCode && (
                <Text style={styles.medicalDesc}>Share this one-time code: {guardianCode}</Text>
              )}
              {guardians.map((g) => (
                <Row key={g.id} label={g.status} value={g.guardian?.email ?? 'Waiting to accept'} />
              ))}
              <View style={styles.divider} />
              <GlassInput label="Accept a guardian invite" placeholder="CODE" value={acceptCode} onChangeText={(t) => setAcceptCode(t.toUpperCase())} autoCapitalize="characters" />
              <Pressable
                style={styles.privacyRow}
                onPress={async () => {
                  try {
                    await acceptGuardianCode(acceptCode.trim());
                    Alert.alert('Connected', 'You will be alerted if they trigger Emergency SOS.');
                    setAcceptCode('');
                  } catch (err: any) {
                    Alert.alert('Could not accept', err?.response?.data?.message ?? 'Invalid code.');
                  }
                }}
              >
                <Text style={styles.privacyRowText}>Accept guardian code</Text>
              </Pressable>
            </Glass>

            <Glass style={styles.detailsCard}>
              <Text style={styles.sectionHeader}>Change password</Text>
              <View style={styles.divider} />
              <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md }}>
                <GlassInput
                  label="Current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <GlassInput
                  label="New password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="At least 8 characters"
                />
                <GlassInput
                  label="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                {passwordMsg ? <Text style={styles.passwordOk}>{passwordMsg}</Text> : null}
                <Pressable
                  style={[styles.signOutBtn, { marginTop: 0 }]}
                  onPress={handleChangePassword}
                  disabled={passwordBusy || !currentPassword || !newPassword}
                >
                  <Text style={styles.signOutText}>{passwordBusy ? 'Updating…' : 'Update password'}</Text>
                </Pressable>
              </View>
            </Glass>

            <Glass style={styles.privacyCard}>
              <Text style={styles.sectionHeader}>Privacy &amp; data</Text>
              <Pressable style={styles.privacyRow} onPress={handleExport} disabled={busy !== null}>
                <Download size={16} color={colors.indigoink} />
                <Text style={styles.privacyRowText}>
                  {busy === 'export' ? 'Preparing…' : 'Export my data'}
                </Text>
              </Pressable>
              <View style={styles.divider} />
              <Pressable style={styles.privacyRow} onPress={handleDeleteAccount} disabled={busy !== null}>
                <Trash2 size={16} color="#C0433E" />
                <Text style={[styles.privacyRowText, styles.deleteText]}>
                  {busy === 'delete' ? 'Deleting…' : 'Delete my account'}
                </Text>
              </Pressable>
            </Glass>

            <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          // EDIT MODE
          <View style={styles.editForm}>
            <Text style={styles.sectionHeader}>Contact & Academic Info</Text>
            <GlassInput label="Mobile Phone" value={formData.mobile} onChangeText={(t) => setFormData({...formData, mobile: t})} keyboardType="phone-pad" />
            <GlassInput label="Roll Number" value={formData.studentNumber} onChangeText={(t) => setFormData({...formData, studentNumber: t})} />
            <GlassInput label="Department" value={formData.department} onChangeText={(t) => setFormData({...formData, department: t})} />
            <GlassInput label="Course" value={formData.course} onChangeText={(t) => setFormData({...formData, course: t})} />
            <GlassInput label="Semester" value={formData.semester} onChangeText={(t) => setFormData({...formData, semester: t})} />
            <GlassInput label="Year" value={formData.year} onChangeText={(t) => setFormData({...formData, year: t})} keyboardType="number-pad" />
            
            <View style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
              <Text style={styles.label}>Residence Type</Text>
              <View style={styles.radioGroup}>
                <Pressable style={[styles.radioOption, !formData.isHosteler && styles.radioOptionActive]} onPress={() => setFormData({...formData, isHosteler: false})}>
                  <Text style={[styles.radioText, !formData.isHosteler && styles.radioTextActive]}>Day Scholar</Text>
                </Pressable>
                <Pressable style={[styles.radioOption, formData.isHosteler && styles.radioOptionActive]} onPress={() => setFormData({...formData, isHosteler: true})}>
                  <Text style={[styles.radioText, formData.isHosteler && styles.radioTextActive]}>Hosteler</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.sectionHeader}>Emergency Info</Text>
            <GlassInput label="Emergency Contact Name" value={formData.emergencyContactName} onChangeText={(t) => setFormData({...formData, emergencyContactName: t})} />
            <GlassInput label="Emergency Phone" value={formData.emergencyContactPhone} onChangeText={(t) => setFormData({...formData, emergencyContactPhone: t})} keyboardType="phone-pad" />
            <GlassInput label="Blood Group" value={formData.bloodGroup} onChangeText={(t) => setFormData({...formData, bloodGroup: t})} />

            <View style={styles.actionRow}>
              <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={handleCancel} disabled={saving}>
                <X size={18} color={colors.subink} />
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.saveBtn]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" size="small" /> : (
                  <>
                    <Check size={18} color="#FFF" />
                    <Text style={styles.saveText}>Save Profile</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingHorizontal: 4,
  },
  screenTitle: {
    ...typography.h1,
    fontSize: 28,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.lavenderTint,
    borderRadius: radius.pill,
  },
  editButtonText: {
    ...typography.body,
    color: colors.indigoink,
    fontFamily: 'Inter_500Medium',
  },
  loading: {
    marginTop: spacing.xxl,
  },
  error: {
    ...typography.caption,
    color: '#C0433E',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(91, 110, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarInitials: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: colors.indigoink,
  },
  name: {
    ...typography.h1,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  college: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
    marginTop: 4,
    textAlign: 'center',
  },
  detailsCard: {
    paddingVertical: spacing.md,
  },
  sectionHeader: {
    ...typography.h3,
    fontSize: 16,
    color: colors.indigoink,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  medicalCard: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  medicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  medicalTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  medicalDesc: {
    ...typography.caption,
    color: colors.mutedink,
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  medicalContent: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.mutedink,
  },
  rowValue: {
    ...typography.body,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
    maxWidth: '62%',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  privacyCard: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  privacyRowText: {
    ...typography.body,
    fontSize: 14,
    color: colors.ink,
  },
  deleteText: {
    color: '#C0433E',
  },
  passwordOk: {
    ...typography.caption,
    color: colors.mintInk,
  },
  signOutBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.indigoink,
  },
  editForm: {
    gap: spacing.lg,
  },
  label: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
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
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: radius.input,
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  saveBtn: {
    backgroundColor: colors.indigoink,
  },
  cancelText: {
    ...typography.body,
    fontFamily: 'Inter_500Medium',
    color: colors.subink,
  },
  saveText: {
    ...typography.body,
    fontFamily: 'Inter_500Medium',
    color: '#FFF',
  },
});
