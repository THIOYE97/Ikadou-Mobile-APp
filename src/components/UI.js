import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

const BRAND = {
  bg: '#F3F3F3',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#666666',
  border: '#E8E8E8',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.08)',
  orange: '#F28C28',
  orangeSoft: 'rgba(242,140,40,0.12)',
  green: '#16A34A',
  error: '#DC2626',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  icon,
}) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.86}
      style={[
        styles.btnBase,
        isPrimary && styles.btnPrimary,
        isSecondary && styles.btnSecondary,
        isGhost && styles.btnGhost,
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : BRAND.teal} size="small" />
      ) : (
        <>
          {icon ? <View style={{ marginRight: 6 }}>{icon}</View> : null}
          <Text
            style={[
              styles.btnLabel,
              isPrimary && styles.btnLabelPrimary,
              isSecondary && styles.btnLabelSecondary,
              isGhost && styles.btnLabelGhost,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function Input({ label, error, style, containerStyle, ...props }) {
  return (
    <View style={[styles.inputWrap, containerStyle]}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#9A9A9A"
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.inputErrorMsg}>{error}</Text> : null}
    </View>
  );
}

export function Badge({ label, variant = 'teal', style }) {
  const bg = variant === 'orange' ? BRAND.orangeSoft : BRAND.tealSoft;
  const color = variant === 'orange' ? BRAND.orange : BRAND.teal;
  const borderColor = variant === 'orange' ? 'rgba(242,140,40,0.18)' : 'rgba(0,140,140,0.18)';

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor }, style]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function SectionTag({ label }) {
  return (
    <View style={styles.sectionTag}>
      <Text style={styles.sectionTagText}>{label}</Text>
    </View>
  );
}

export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

export function ScreenHeader({ title, subtitle, onBack, rightAction }) {
  return (
    <View style={styles.screenHeader}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text style={styles.screenHeaderTitle}>{title}</Text>
        {subtitle ? <Text style={styles.screenHeaderSub}>{subtitle}</Text> : null}
      </View>

      {rightAction ? <View>{rightAction}</View> : null}
    </View>
  );
}

export function EmptyState({ icon = '🌍', title, subtitle, action }) {
  return (
    <View style={styles.stateWrap}>
      <Text style={styles.stateIcon}>{icon}</Text>
      <Text style={styles.stateTitle}>{title}</Text>
      {subtitle ? <Text style={styles.stateSub}>{subtitle}</Text> : null}
      {action}
    </View>
  );
}

export function ErrorState({ onRetry }) {
  return (
    <View style={styles.stateWrap}>
      <Text style={styles.stateIcon}>⚠️</Text>
      <Text style={styles.stateTitle}>Chargement impossible</Text>
      <Text style={styles.stateSub}>Vérifiez votre connexion et réessayez.</Text>
      {onRetry ? (
        <Button label="Réessayer" onPress={onRetry} style={{ marginTop: 16 }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btnBase: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
  },

  btnPrimary: {
    backgroundColor: BRAND.teal,
  },

  btnSecondary: {
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.teal,
  },

  btnGhost: {
    backgroundColor: 'transparent',
  },

  btnDisabled: {
    opacity: 0.55,
  },

  btnLabel: {
    fontSize: 15,
    fontWeight: '800',
  },

  btnLabelPrimary: {
    color: '#fff',
  },

  btnLabelSecondary: {
    color: BRAND.teal,
  },

  btnLabelGhost: {
    color: BRAND.textSoft,
  },

  inputWrap: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.textSoft,
    marginBottom: 6,
  },

  input: {
    height: 48,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: BRAND.text,
    fontSize: 15,
  },

  inputError: {
    borderColor: BRAND.error,
  },

  inputErrorMsg: {
    color: BRAND.error,
    fontSize: 12,
    marginTop: 5,
  },

  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  sectionTag: {
    backgroundColor: BRAND.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(0,140,140,0.18)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },

  sectionTagText: {
    fontSize: 11,
    color: BRAND.teal,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  divider: {
    height: 1,
    backgroundColor: BRAND.border,
    marginVertical: 16,
  },

  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: BRAND.bg,
  },

  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: BRAND.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: {
    fontSize: 18,
    color: BRAND.text,
  },

  screenHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.text,
  },

  screenHeaderSub: {
    fontSize: 13,
    color: BRAND.textSoft,
    marginTop: 2,
  },

  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },

  stateIcon: {
    fontSize: 40,
    marginBottom: 14,
  },

  stateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.text,
    textAlign: 'center',
    marginBottom: 8,
  },

  stateSub: {
    fontSize: 14,
    color: BRAND.textSoft,
    textAlign: 'center',
    lineHeight: 20,
  },
});