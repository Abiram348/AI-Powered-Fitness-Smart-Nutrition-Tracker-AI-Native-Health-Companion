import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/context/AuthContext';
import { GradientButton, TextInput } from '../../src/components/UI';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = error.response?.data?.detail 
        || (error.message?.includes('Network Error') ? 'Cannot connect to server. Make sure your phone is on the same Wi-Fi as your computer.' : 'Something went wrong. Please try again.');
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={Colors.gradients.primary}
            style={styles.logoGradient}
          >
            <Ionicons name="fitness" size={36} color="#fff" />
          </LinearGradient>
          <Text style={styles.appName}>FitTrack AI</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.welcomeText}>Create Account</Text>
          <Text style={styles.descText}>Start your fitness journey today</Text>

          <TextInput
            label="Full Name"
            icon="person-outline"
            placeholder="Your name"
            value={form.name}
            onChangeText={(v) => updateForm('name', v)}
            autoCapitalize="words"
          />

          <TextInput
            label="Email"
            icon="mail-outline"
            placeholder="you@example.com"
            value={form.email}
            onChangeText={(v) => updateForm('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextInput
            label="Password"
            icon="lock-closed-outline"
            placeholder="Min. 6 characters"
            value={form.password}
            onChangeText={(v) => updateForm('password', v)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />

          <TextInput
            label="Confirm Password"
            icon="shield-checkmark-outline"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChangeText={(v) => updateForm('confirmPassword', v)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.showPasswordBtn}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={16}
              color={Colors.textTertiary}
            />
            <Text style={styles.showPasswordText}>
              {showPassword ? 'Hide' : 'Show'} passwords
            </Text>
          </TouchableOpacity>

          <GradientButton
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            icon="person-add-outline"
            style={{ marginTop: Spacing.lg }}
          />

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -1,
  },
  form: {
    width: '100%',
  },
  welcomeText: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  descText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  showPasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  showPasswordText: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
  },
  switchBtn: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
  },
  switchText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  switchLink: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
