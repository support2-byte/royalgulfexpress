import { Button } from "@/components/ui/Button";
import {
  OptionRow,
  SelectField,
  SheetModal,
  TextField,
} from "@/components/ui/Form";
import { LanguageButton } from "@/components/ui/LanguageSwitcher";
import { Text } from "@/components/ui/Text";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ls, tr } from "@/i18n";
import logo from "@assets/images/logo.png";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type Login = {
  email: string;
};

type AccountType = "receiver" | "sender";

type Signup = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  accountType: AccountType;
};

const ACCOUNT_TYPE_OPTIONS: { label: string; value: AccountType }[] = [
  { label: "Receiver", value: "receiver" },
  { label: "Sender", value: "sender" },
];

const Auth = () => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const {
    login: loginFunc,
    sendOtp,
    verifyOtp,
    signup: signupFunc,
  } = useAuth();

  const [login, setLogin] = useState<Login>({ email: "" });
  const [signup, setSignup] = useState<Signup>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    accountType: "receiver",
  });
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleAuthPress = async () => {
    if (isLogin) {
      if (!login.email.trim()) {
        Toast.show({
          type: "error",
          text1: tr("Missing information"),
          text2: tr("Please enter your email."),
        });
        return;
      }

      setSubmitting(true);
      const ok = await loginFunc({
        email: login.email.trim(),
      });
      setSubmitting(false);

      if (ok) setOtpStep(true);
      return;
    }

    if (
      !signup.fullName.trim() ||
      !signup.email.trim() ||
      !signup.phone.trim() ||
      !signup.password
    ) {
      Toast.show({
        type: "error",
        text1: tr("Missing information"),
        text2: tr("Please complete all fields."),
      });
      return;
    }

    setSubmitting(true);
    await signupFunc({
      fullName: signup.fullName.trim(),
      email: signup.email.trim(),
      phone: signup.phone.trim(),
      password: signup.password,
      accountType: signup.accountType,
    });
    setSubmitting(false);
  };

  const handleVerifyPress = async () => {
    if (!otp.trim()) {
      Toast.show({
        type: "error",
        text1: tr("Missing OTP"),
        text2: tr("Enter the code sent to your email."),
      });
      return;
    }

    setVerifying(true);
    const success = await verifyOtp(login.email.trim(), otp.trim());
    setVerifying(false);

    if (success) {
      router.replace("/home");
    }
  };

  const handleResend = async () => {
    if (submitting) return;
    setSubmitting(true);
    await sendOtp(login.email.trim());
    setSubmitting(false);
  };

  const resetToLoginStart = () => {
    setOtpStep(false);
    setOtp("");
  };

  const selectedAccountTypeLabel =
    ACCOUNT_TYPE_OPTIONS.find((opt) => opt.value === signup.accountType)
      ?.label ?? "Select account type";

  const headlineFull = tr(
    otpStep && isLogin
      ? "Check your email."
      : isLogin
        ? "Welcome back."
        : "Create your account.",
  );
  const lastSpace = headlineFull.lastIndexOf(" ");
  const headline = headlineFull.slice(0, lastSpace);
  const headlineMuted = headlineFull.slice(lastSpace + 1);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LanguageButton />
          <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.headline}>
              {headline}{" "}
              <Text style={styles.headlineMuted}>{headlineMuted}</Text>
            </Text>
            <Text style={styles.subline}>
              {otpStep && isLogin
                ? "Enter the 6-digit code we just sent you."
                : isLogin
                  ? "Sign in to track and manage your cargo."
                  : "Tell us a little about yourself."}
            </Text>
          </Animated.View>

          <Animated.View
            key={otpStep ? "otp" : isLogin ? "login" : "signup"}
            entering={FadeInDown.duration(420).delay(80)}
            style={styles.sheet}
          >
            {isLogin && otpStep ? (
              <>
                <Text style={styles.label}>
                  Code sent to{" "}
                  <Text style={{ color: colors.primary }}>{login.email}</Text>
                </Text>
                <OtpInput
                  numberOfDigits={6}
                  onTextChange={setOtp}
                  theme={{
                    containerStyle: { marginTop: 18, marginBottom: 28 },
                    pinCodeContainerStyle: {
                      borderWidth: 0,
                      borderRadius: 18,
                      width: 48,
                      height: 58,
                      backgroundColor: colors.surface,
                    },
                    pinCodeTextStyle: {
                      color: colors.ink,
                      fontFamily: fonts.bold,
                    },
                    focusedPinCodeContainerStyle: {
                      borderWidth: 2,
                      borderColor: colors.primary,
                      backgroundColor: colors.background,
                    },
                  }}
                />
                <Button
                  label={verifying ? "Verifying..." : "Verify & sign in"}
                  variant="primary"
                  loading={verifying}
                  onPress={handleVerifyPress}
                />
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleResend}
                    disabled={submitting}
                  >
                    <Text style={styles.toggleLink}>
                      {submitting ? "Resending..." : "Resend code"}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.toggleDot} />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={resetToLoginStart}
                  >
                    <Text style={styles.toggleLink}>{tr("Change email")}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {!isLogin && (
                  <>
                    <TextField
                      icon="person-outline"
                      placeholder={tr("Full name")}
                      value={signup.fullName}
                      onChangeText={(fullName) =>
                        setSignup((prev) => ({ ...prev, fullName }))
                      }
                      autoCapitalize="words"
                    />
                    <TextField
                      icon="call-outline"
                      placeholder={tr("Phone number")}
                      value={signup.phone}
                      onChangeText={(phone) =>
                        setSignup((prev) => ({ ...prev, phone }))
                      }
                      keyboardType="phone-pad"
                    />
                    <SelectField
                      icon="briefcase-outline"
                      value={selectedAccountTypeLabel}
                      placeholder={tr("Account type")}
                      onPress={() => setTypeDropdownOpen(true)}
                    />
                    <SheetModal
                      visible={typeDropdownOpen}
                      title={tr("Account type")}
                      onClose={() => setTypeDropdownOpen(false)}
                    >
                      {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                        <OptionRow
                          key={opt.value}
                          title={opt.label}
                          selected={signup.accountType === opt.value}
                          onPress={() => {
                            setSignup((prev) => ({
                              ...prev,
                              accountType: opt.value,
                            }));
                            setTypeDropdownOpen(false);
                          }}
                        />
                      ))}
                    </SheetModal>
                  </>
                )}

                <TextField
                  icon="mail-outline"
                  placeholder={tr("Email address")}
                  inputMode="email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={isLogin ? login.email : signup.email}
                  onChangeText={(email) => {
                    if (isLogin) {
                      setLogin((prev) => ({ ...prev, email }));
                    } else {
                      setSignup((prev) => ({ ...prev, email }));
                    }
                  }}
                />

                <Button
                  style={styles.submit}
                  variant="primary"
                  label={
                    isLogin
                      ? submitting
                        ? "Signing in..."
                        : "Continue"
                      : submitting
                        ? "Signing up..."
                        : "Create account"
                  }
                  icon="arrow-forward"
                  loading={submitting}
                  onPress={handleAuthPress}
                />

                <Text style={styles.footnote}>
                  {tr("We'll email you a one-time code. No password needed.")}
                </Text>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"],
  fontSize: ReturnType<typeof useAppTheme>["fontSize"],
  fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    hero: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32 },
    logo: { width: 220, height: 70, marginBottom: 20, marginLeft: -10 },
    headline: {
      fontSize: 38,
      lineHeight: 44,
      fontFamily: fonts.bold,
      color: colors.ink,
      letterSpacing: ls(-1.2),
    },
    headlineMuted: { color: colors.lightText },
    subline: {
      fontSize: fontSize.sm,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      marginTop: 10,
      lineHeight: 20,
    },
    sheet: {
      flex: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 40,
    },
    label: {
      color: colors.textSecondary,
      fontSize: fontSize.sm,
      fontFamily: fonts.medium,
    },
    submit: { marginTop: 16 },
    footnote: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.lightText,
      textAlign: "center",
      marginTop: 18,
    },
    toggleContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      marginTop: 22,
    },
    toggleDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderColor,
    },
    toggleLink: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.secondary,
    },
  });

export default Auth;
