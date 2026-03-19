import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

const CGU_URL = 'https://randonnee-reunion.re/cgu';
const PRIVACY_URL = 'https://randonnee-reunion.re/confidentialite';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { signUp, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cguAccepted, setCguAccepted] = useState(false);

  const handleRegister = async () => {
    if (!cguAccepted) {
      Alert.alert('Erreur', 'Tu dois accepter les CGU et la politique de confidentialite pour continuer.');
      return;
    }
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Remplis tous les champs.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit faire au moins 6 caracteres.');
      return;
    }

    const { error } = await signUp(email.trim(), password, username.trim());
    if (error) {
      Alert.alert('Erreur', error);
    } else {
      Alert.alert(
        'Bienvenue !',
        'Ton compte a ete cree. Connecte-toi maintenant.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Creer un compte</Text>
        <Text style={styles.subtitle}>Rejoins la communaute des randonneurs</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nom d'utilisateur"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            accessibilityLabel="Nom d'utilisateur"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            accessibilityLabel="Adresse email"
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe (6 caracteres min.)"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            accessibilityLabel="Mot de passe"
            textContentType="newPassword"
          />
          {password.length > 0 && password.length < 6 && (
            <Text style={styles.passwordHint}>
              Encore {6 - password.length} caractere{6 - password.length > 1 ? 's' : ''} requis
            </Text>
          )}
          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            accessibilityLabel="Confirmer le mot de passe"
          />

          <Pressable
            style={styles.checkboxRow}
            onPress={() => setCguAccepted((prev) => !prev)}
            accessibilityLabel="Accepter les conditions generales d'utilisation"
          >
            <View style={[styles.checkbox, cguAccepted && styles.checkboxChecked]}>
              {cguAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              J'accepte les{' '}
              <Text
                style={styles.legalLink}
                onPress={() => Linking.openURL(CGU_URL)}
              >
                Conditions Generales d'Utilisation
              </Text>
              {' '}et la{' '}
              <Text
                style={styles.legalLink}
                onPress={() => Linking.openURL(PRIVACY_URL)}
              >
                Politique de confidentialite
              </Text>
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, (isLoading || !cguAccepted) && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading || !cguAccepted}
            accessibilityLabel="S'inscrire"
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creation...' : "S'inscrire"}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.goBack()} accessibilityLabel="Se connecter">
          <Text style={styles.link}>
            Deja un compte ? <Text style={styles.linkBold}>Se connecter</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  form: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: SPACING.xxl,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
    minHeight: SPACING.xxl,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  link: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  linkBold: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    lineHeight: 16,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  passwordHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
    marginTop: -SPACING.xs,
    marginLeft: SPACING.sm,
  },
  legalLink: {
    color: COLORS.primaryLight,
    textDecorationLine: 'underline',
  },
});
