import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import {
  HeartPulse,
  Edit2,
  Check,
  X,
  Download,
  Trash2,
  GraduationCap,
  Building2,
  UserPlus,
  Lock,
  Shield,
  LogOut,
  ChevronRight,
  Copy,
  Share2,
} from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { Glass, GlassInput } from '../../src/components/ui-kit';
import {
  getMyProfile, updateMyProfile, exportMyData, deleteMyAccount, joinOrganization,
} from '../../src/services/membersService';
import { changePassword } from '../../src/services/authService';
import { inviteGuardian, listMyGuardians, acceptGuardianCode } from '../../src/services/guardiansService';
import type { StudentProfile } from '../../src/types';
import { colors, radius, spacing, typography } from '../../src/constants/theme';
import { useAuth } from '../../src/store/AuthContext';
import { tapFeedback, successFeedback } from '../../src/services/haptics';

type ProfileSheet = 'academic' | 'medical' | 'org' | 'guardian' | 'password' | 'privacy';

type IconType = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function MenuRow({
  icon: Icon,
  label,
  value,
  onPress,
  destructive,
}: {
  icon: IconType;
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, destructive && styles.menuIconDanger]}>
        <Icon size={18} strokeWidth={1.8} color={destructive ? '#C0433E' : colors.indigoink} />
      </View>
      <Text style={[styles.menuLabel, destructive && styles.deleteText]} numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text style={styles.menuValue} numberOfLines={1}>{value}</Text>
      ) : null}
      {!destructive && <ChevronRight size={18} color={colors.mutedink} />}
    </Pressable>
  );
}

const SHEET_TITLES: Record<ProfileSheet, string> = {
  academic: 'Academic & Contact Details',
  medical: 'Emergency medical info',
  org: 'Organization',
  guardian: 'Guardian',
  password: 'Change password',
  privacy: 'Privacy & data',
};

function InviteCodeCard({ generating, code }: { generating: boolean; code: string | null }) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current); }, []);

  if (!generating && !code) return null;

  const handleCopy = async () => {
    if (!code || generating) return;
    const ok = await Clipboard.setStringAsync(code);
    if (Platform.OS !== 'web' || ok) {
      setCopied(true);
      successFeedback();
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } else {
      Alert.alert('Could not copy', 'Use Share instead.');
    }
  };

  const handleShare = async () => {
    if (!code || generating) return;
    const message = `Your Safety app guardian invite code is ${code}. Open the app → Profile → Guardian, then enter this code.`;
    try {
      await Share.share({ message, title: 'Guardian invite code' });
    } catch {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      successFeedback();
    }
  };

  return (
    <View style={styles.codeCard}>
      <Text style={styles.codeLabel}>
        {generating ? 'Generating invite code' : 'Share this one-time code'}
      </Text>
      <Text style={[styles.codeDigits, generating && styles.codeDigitsLive]}>{generating ? 'Preparing...' : code}</Text>
      <Text style={styles.codeHint}>
        {generating ? 'This only takes a moment…' : 'Your guardian enters this in their app'}
      </Text>
      {!generating && code ? (
        <View style={styles.codeActions}>
          <Pressable style={styles.codeActionBtn} onPress={handleCopy}>
            <Copy size={16} color={colors.indigoink} />
            <Text style={styles.codeActionText}>{copied ? 'Copied' : 'Copy'}</Text>
          </Pressable>
          <Pressable style={styles.codeActionBtn} onPress={handleShare}>
            <Share2 size={16} color={colors.indigoink} />
            <Text style={styles.codeActionText}>Share</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const NOT_SET = 'Not set';

export default function ProfileScreen() {
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const { logout } = useAuth();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<ProfileSheet | null>(null);
  useFocusEffect(useCallback(() => {
    if (section === 'guardian' || section === 'org') {
      setSheet(section);
      router.setParams({ section: undefined });
    }
  }, [section, router]));

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

  const [guardians, setGuardians] = useState<{ id: string; status: string; guardian: { email: string } | null }[]>([]);

  const applyProfile = useCallback((p: StudentProfile) => {
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
  }, []);

  const loadProfile = useCallback(() => {
    setLoading(true);
    getMyProfile()
      .then((p) => {
        applyProfile(p);
        setError(null);
        listMyGuardians().then(setGuardians).catch(() => undefined);
      })
      .catch(() => setError('Could not load your profile.'))
      .finally(() => setLoading(false));
  }, [applyProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const [busy, setBusy] = useState<null | 'export' | 'delete'>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [guardianCode, setGuardianCode] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [acceptCode, setAcceptCode] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  const openSheet = (id: ProfileSheet) => {
    tapFeedback();
    setIsEditing(false);
    setError(null);
    setPasswordMsg(null);
    setSheet(id);
  };

  const closeSheet = () => {
    if (isEditing && profile) applyProfile(profile);
    setIsEditing(false);
    setSheet(null);
  };

  const handleSignOut = async () => {
    tapFeedback();
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
      applyProfile(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) applyProfile(profile);
  };

  const handleJoinOrg = async () => {
    setJoining(true);
    try {
      await joinOrganization(joinCode.trim());
      loadProfile();
    } catch (err: any) {
      Alert.alert('Could not join', err?.response?.data?.message ?? 'Check the join code.');
    } finally {
      setJoining(false);
    }
  };

  const handleInviteGuardian = async () => {
    if (inviting) return;
    tapFeedback();
    setInviting(true);
    setGuardianCode(null);
    const started = Date.now();
    try {
      const invited = await inviteGuardian();
      const wait = Math.max(0, 1100 - (Date.now() - started));
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
      setGuardianCode(invited.code);
      successFeedback();
    } catch {
      Alert.alert('Could not create invite', 'Please try again in a moment.');
    } finally {
      setInviting(false);
    }
  };

  const handleAcceptGuardian = async () => {
    try {
      await acceptGuardianCode(acceptCode.trim());
      Alert.alert('Connected', 'You will be alerted if they trigger Emergency SOS.');
      setAcceptCode('');
      listMyGuardians().then(setGuardians).catch(() => undefined);
    } catch (err: any) {
      Alert.alert('Could not accept', err?.response?.data?.message ?? 'Invalid code.');
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
  const orgName = profile?.college?.name ?? profile?.organization?.name;
  const canEditSheet = sheet === 'academic' || sheet === 'medical';

  const renderSheetBody = () => {
    if (sheet === 'academic') {
      if (isEditing) {
        return (
          <View style={styles.editForm}>
            <GlassInput label="Mobile Phone" value={formData.mobile} onChangeText={(t) => setFormData({ ...formData, mobile: t })} keyboardType="phone-pad" />
            <GlassInput label="Roll Number" value={formData.studentNumber} onChangeText={(t) => setFormData({ ...formData, studentNumber: t })} />
            <GlassInput label="Department" value={formData.department} onChangeText={(t) => setFormData({ ...formData, department: t })} />
            <GlassInput label="Course" value={formData.course} onChangeText={(t) => setFormData({ ...formData, course: t })} />
            <GlassInput label="Semester" value={formData.semester} onChangeText={(t) => setFormData({ ...formData, semester: t })} />
            <GlassInput label="Year" value={formData.year} onChangeText={(t) => setFormData({ ...formData, year: t })} keyboardType="number-pad" />
            <View style={{ marginBottom: spacing.md }}>
              <Text style={styles.label}>Residence Type</Text>
              <View style={styles.radioGroup}>
                <Pressable style={[styles.radioOption, !formData.isHosteler && styles.radioOptionActive]} onPress={() => setFormData({ ...formData, isHosteler: false })}>
                  <Text style={[styles.radioText, !formData.isHosteler && styles.radioTextActive]}>Day Scholar</Text>
                </Pressable>
                <Pressable style={[styles.radioOption, formData.isHosteler && styles.radioOptionActive]} onPress={() => setFormData({ ...formData, isHosteler: true })}>
                  <Text style={[styles.radioText, formData.isHosteler && styles.radioTextActive]}>Hosteler</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.actionRow}>
              <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={handleCancel} disabled={saving}>
                <X size={18} color={colors.subink} />
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.saveBtn]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" size="small" /> : (
                  <>
                    <Check size={18} color="#FFF" />
                    <Text style={styles.saveText}>Save</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        );
      }
      return (
        <>
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
        </>
      );
    }

    if (sheet === 'medical') {
      if (isEditing) {
        return (
          <View style={styles.editForm}>
            <Text style={[styles.medicalDesc, styles.flushText]}>Shared only when you send an emergency alert.</Text>
            <GlassInput label="Emergency Contact Name" value={formData.emergencyContactName} onChangeText={(t) => setFormData({ ...formData, emergencyContactName: t })} />
            <GlassInput label="Emergency Phone" value={formData.emergencyContactPhone} onChangeText={(t) => setFormData({ ...formData, emergencyContactPhone: t })} keyboardType="phone-pad" />
            <GlassInput label="Blood Group" value={formData.bloodGroup} onChangeText={(t) => setFormData({ ...formData, bloodGroup: t })} />
            <View style={styles.actionRow}>
              <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={handleCancel} disabled={saving}>
                <X size={18} color={colors.subink} />
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.saveBtn]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" size="small" /> : (
                  <>
                    <Check size={18} color="#FFF" />
                    <Text style={styles.saveText}>Save</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        );
      }
      return (
        <>
          <Text style={styles.medicalDesc}>Shared only when you send an emergency alert.</Text>
          <Row label="Emergency Contact" value={profile?.emergencyContactName ?? NOT_SET} />
          <View style={styles.divider} />
          <Row label="Emergency Phone" value={profile?.emergencyContactPhone ?? NOT_SET} />
          <View style={styles.divider} />
          <Row label="Blood group" value={profile?.bloodGroup ?? NOT_SET} />
        </>
      );
    }

    if (sheet === 'org') {
      return (
        <>
          <Text style={styles.medicalDesc}>
            Join your college or workplace so the committee can receive your reports.
          </Text>
          {orgName ? <Row label="Organization" value={orgName} /> : null}
          {!(profile?.organizationId || profile?.college?.id) && (
            <View style={styles.sheetSection}>
              <GlassInput label="Join code" placeholder="DEMOJOIN" value={joinCode} onChangeText={(t) => setJoinCode(t.toUpperCase())} autoCapitalize="characters" />
              <Pressable
                style={[styles.sheetBtn, (joining || joinCode.length < 4) && styles.sheetBtnDisabled]}
                disabled={joining || joinCode.length < 4}
                onPress={handleJoinOrg}
              >
                <Text style={styles.sheetBtnText}>{joining ? 'Joining…' : 'Join organization'}</Text>
              </Pressable>
            </View>
          )}
        </>
      );
    }

    if (sheet === 'guardian') {
      return (
        <>
          <Text style={styles.medicalDesc}>
            Invite someone you trust. They are alerted if you send Emergency SOS.
          </Text>
          <View style={styles.sheetSection}>
            <Pressable
              style={[styles.sheetBtn, inviting && styles.sheetBtnDisabled]}
              disabled={inviting}
              onPress={handleInviteGuardian}
            >
              <Text style={styles.sheetBtnText}>
                {inviting ? 'Generating…' : guardianCode ? 'Generate a new code' : 'Generate invite code'}
              </Text>
            </Pressable>
            <InviteCodeCard generating={inviting} code={guardianCode} />
          </View>
          {guardians.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Your guardians</Text>
              {guardians.map((g) => (
                <Row key={g.id} label={g.status} value={g.guardian?.email ?? 'Waiting to accept'} />
              ))}
            </>
          )}
          <View style={styles.divider} />
          <View style={styles.sheetSection}>
            <GlassInput label="Accept a guardian invite" placeholder="CODE" value={acceptCode} onChangeText={(t) => setAcceptCode(t.toUpperCase())} autoCapitalize="characters" />
            <Pressable style={[styles.privacyRow, styles.flushRow]} onPress={handleAcceptGuardian}>
              <Text style={styles.privacyRowText}>Accept guardian code</Text>
            </Pressable>
          </View>
        </>
      );
    }

    if (sheet === 'password') {
      return (
        <View style={styles.sheetSection}>
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
            style={[styles.sheetBtn, (passwordBusy || !currentPassword || !newPassword) && styles.sheetBtnDisabled]}
            onPress={handleChangePassword}
            disabled={passwordBusy || !currentPassword || !newPassword}
          >
            <Text style={styles.sheetBtnText}>{passwordBusy ? 'Updating…' : 'Update password'}</Text>
          </Pressable>
        </View>
      );
    }

    if (sheet === 'privacy') {
      return (
        <>
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
        </>
      );
    }

    return null;
  };

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Your space</Text>
        <Text style={{ ...typography.body, color: colors.subink, marginBottom: 16 }}>Your details, trusted people, and preferences.</Text>

        {error && !sheet && <Text style={styles.error}>{error}</Text>}

        <Glass style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials || '?'}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.college}>{orgName ?? 'No organization yet'}</Text>
        </Glass>

        <Text style={styles.groupTitle}>Personal details</Text>
        <Glass style={styles.menuCard}>
          <MenuRow
            icon={GraduationCap}
            label="Academic & Contact Details"
            value={profile?.department ?? undefined}
            onPress={() => openSheet('academic')}
          />
        </Glass>
        <Text style={styles.groupTitle}>Safety setup</Text>
        <Glass style={styles.menuCard}>
          <MenuRow
            icon={HeartPulse}
            label="Emergency medical info"
            value={profile?.bloodGroup ?? undefined}
            onPress={() => openSheet('medical')}
          />
          <View style={styles.menuDivider} />
          <MenuRow
            icon={Building2}
            label="Organization"
            value={orgName ?? 'Not joined'}
            onPress={() => openSheet('org')}
          />
          <View style={styles.menuDivider} />
          <MenuRow
            icon={UserPlus}
            label="Guardian"
            value={guardians.some(g => g.status === 'ACTIVE') ? 'Connected' : guardians.some(g => g.status === 'PENDING') ? 'Invite pending' : 'Set up'}
            onPress={() => openSheet('guardian')}
          />
        </Glass>
        <Text style={styles.groupTitle}>Account & privacy</Text>
        <Glass style={styles.menuCard}>
          <MenuRow
            icon={Lock}
            label="Change password"
            onPress={() => openSheet('password')}
          />
          <View style={styles.menuDivider} />
          <MenuRow
            icon={Shield}
            label="Privacy & data"
            onPress={() => openSheet('privacy')}
          />
        </Glass>

        <Glass style={styles.menuCard}>
          <MenuRow
            icon={LogOut}
            label="Sign out"
            destructive
            onPress={handleSignOut}
          />
        </Glass>
      </ScrollView>

      <Modal
        visible={sheet !== null}
        transparent
        animationType="fade"
        onRequestClose={closeSheet}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeSheet} />
          <View style={styles.popup}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {sheet ? SHEET_TITLES[sheet] : ''}
              </Text>
              <View style={styles.sheetHeaderActions}>
                {canEditSheet && !isEditing && (
                  <Pressable onPress={() => setIsEditing(true)} style={styles.editButton}>
                    <Edit2 size={16} color={colors.indigoink} />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </Pressable>
                )}
                <Pressable onPress={closeSheet} style={styles.sheetClose} hitSlop={8}>
                  <X size={18} color={colors.subink} />
                </Pressable>
              </View>
            </View>
            {error && sheet && <Text style={styles.sheetError}>{error}</Text>}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.sheetScroll}
            >
              {renderSheetBody()}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  groupTitle: { ...typography.h3, color: colors.mintInk, marginBottom: 10, marginTop: 12 },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  screenTitle: {
    ...typography.h1,
    fontSize: 28,
    marginBottom: spacing.xl,
    paddingHorizontal: 4,
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
  sheetError: {
    ...typography.caption,
    color: '#C0433E',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  avatarSection: {
    backgroundColor: 'rgba(235,231,251,0.6)',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#DDD5F9',
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
    fontSize: 24,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  college: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
    marginTop: 6,
    textAlign: 'center',
  },
  menuCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  menuRowPressed: {
    backgroundColor: 'rgba(15, 118, 110, 0.06)',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.lavenderTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: 'rgba(192, 67, 62, 0.1)',
  },
  menuLabel: {
    ...typography.body,
    fontSize: 15,
    color: colors.ink,
    flex: 1,
  },
  menuValue: {
    ...typography.caption,
    color: colors.mutedink,
    maxWidth: '34%',
    textAlign: 'right',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 64,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(34, 35, 42, 0.45)',
  },
  popup: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    maxHeight: '82%',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 24px 60px -20px rgba(34, 35, 42, 0.4)',
      } as any,
      default: {
        shadowColor: '#22232A',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.28,
        shadowRadius: 32,
        elevation: 16,
      },
    }),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 35, 42, 0.06)',
  },
  sheetTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.ink,
    flex: 1,
  },
  sheetHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 35, 42, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  flushText: {
    paddingHorizontal: 0,
  },
  flushRow: {
    paddingHorizontal: 0,
  },
  sheetSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sheetBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
  },
  sheetBtnDisabled: {
    opacity: 0.5,
  },
  sheetBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.indigoink,
  },
  codeCard: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.lavenderTint,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.16)',
    alignItems: 'center',
  },
  codeLabel: {
    ...typography.caption,
    color: colors.mintInk,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  codeDigits: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    letterSpacing: 6,
    color: colors.indigoink,
    textAlign: 'center',
  },
  codeDigitsLive: {
    fontFamily: 'Inter_500Medium',
    letterSpacing: 5,
    color: colors.subink,
  },
  codeHint: {
    ...typography.caption,
    color: colors.mutedink,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  codeActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  codeActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.input,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.16)',
  },
  codeActionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.indigoink,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.mutedink,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  medicalDesc: {
    ...typography.caption,
    color: colors.mutedink,
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
    backgroundColor: 'rgba(34, 35, 42, 0.06)',
    marginHorizontal: spacing.lg,
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
    marginBottom: spacing.sm,
  },
  editForm: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
