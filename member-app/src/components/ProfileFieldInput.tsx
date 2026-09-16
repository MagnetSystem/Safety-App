import React from 'react';
import { View, Text, Pressable, StyleSheet, Switch } from 'react-native';
import { GlassInput } from './ui-kit';
import { colors, radius, spacing, typography } from '../constants/theme';
import { fieldHint, isValidIsoDate, maskIsoDate } from '../lib/profileFields';
import type { ProfileFieldDef } from '../types';

export function ProfileFieldInput({
  field,
  value,
  onChange,
}: {
  field: ProfileFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const label = `${field.label}${field.required ? ' *' : ''}`;

  if (field.type === 'boolean') {
    return (
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Switch value={value === 'true'} onValueChange={(v) => onChange(v ? 'true' : 'false')} />
      </View>
    );
  }

  if (field.type === 'select' && field.options?.length) {
    return (
      <View>
        <Text style={styles.switchLabel}>{label}</Text>
        <View style={styles.radioGroup}>
          {field.options.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={[styles.radioOption, value === opt && styles.radioOptionActive]}
            >
              <Text style={[styles.radioText, value === opt && styles.radioTextActive]}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  const hint = fieldHint(field);

  if (field.type === 'date') {
    const invalid = value.length > 0 && !isValidIsoDate(value);
    return (
      <View>
        <GlassInput
          label={label}
          value={value}
          onChangeText={(text) => onChange(maskIsoDate(text))}
          placeholder="YYYY-MM-DD"
          keyboardType="number-pad"
          maxLength={10}
        />
        <Text style={[styles.hint, invalid && styles.hintError]}>
          {invalid ? 'Enter a valid date as YYYY-MM-DD, e.g. 2003-05-14' : hint}
        </Text>
      </View>
    );
  }

  return (
    <View>
      <GlassInput
        label={label}
        value={value}
        onChangeText={onChange}
        placeholder={field.help || field.label}
        keyboardType={field.type === 'tel' ? 'phone-pad' : field.type === 'number' ? 'number-pad' : 'default'}
      />
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { ...typography.body, fontSize: 14, color: colors.subink, marginBottom: spacing.sm },
  hint: { ...typography.caption, color: colors.mutedink, marginTop: 4, marginLeft: 4 },
  hintError: { color: '#C0433E' },
  radioGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  radioOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  radioOptionActive: { backgroundColor: colors.lavenderTint, borderColor: colors.lavender },
  radioText: { ...typography.body, color: colors.subink },
  radioTextActive: { color: colors.indigoink, fontFamily: 'Inter_500Medium' },
});
