import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BRAND = {
  text: '#111111',
  textSoft: '#6F6B64',
  white: '#FFFFFF',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.10)',
  orange: '#F28C28',
  danger: '#D64545',
  dangerSoft: 'rgba(214,69,69,0.08)',
};

export default function FormNotice({
  visible,
  type = 'error', // error | success | info
  title,
  message,
  onClose,
}) {
  if (!visible) return null;

  const safeType =
    type === 'success' || type === 'info' || type === 'error' ? type : 'error';

  const config =
    safeType === 'success'
      ? {
          bg: BRAND.tealSoft,
          border: 'rgba(0,140,140,0.14)',
          iconBg: BRAND.white,
          icon: 'checkmark',
          iconColor: BRAND.teal,
        }
      : safeType === 'info'
      ? {
          bg: 'rgba(242,140,40,0.10)',
          border: 'rgba(242,140,40,0.14)',
          iconBg: BRAND.white,
          icon: 'information-circle-outline',
          iconColor: BRAND.orange,
        }
      : {
          bg: BRAND.dangerSoft,
          border: 'rgba(214,69,69,0.14)',
          iconBg: BRAND.white,
          icon: 'alert-circle-outline',
          iconColor: BRAND.danger,
        };

  const hasTitle = typeof title === 'string' && title.trim().length > 0;
  const hasMessage = typeof message === 'string' && message.trim().length > 0;

  if (!hasTitle && !hasMessage) return null;

  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}
      accessibilityRole="alert"
      accessible
    >
      <View style={[styles.header, !hasMessage && styles.headerOnly]}>
        <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
          <Ionicons name={config.icon} size={15} color={config.iconColor} />
        </View>

        <View style={styles.textWrap}>
          {hasTitle ? <Text style={styles.title}>{title}</Text> : null}
          {!hasTitle && hasMessage ? <Text style={styles.title}>{message}</Text> : null}
        </View>

        {typeof onClose === 'function' ? (
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Fermer le message"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={16} color={BRAND.textSoft} />
          </TouchableOpacity>
        ) : null}
      </View>

      {hasTitle && hasMessage ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },

  headerOnly: {
    marginBottom: 0,
    alignItems: 'center',
  },

  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
  },

  textWrap: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND.text,
  },

  message: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.textSoft,
  },

  closeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});