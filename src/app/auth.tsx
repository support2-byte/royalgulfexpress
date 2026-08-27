import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import logo from "@assets/images/logo-black.png";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type Login = {
  email: string;
};

type AccountType = "receiver" | "shipper";

type Signup = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  accountType: AccountType;
};

const ACCOUNT_TYPE_OPTIONS: { label: string; value: AccountType }[] = [
  { label: "Receiver", value: "receiver" },
  { label: "Shipper", value: "shipper" },
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
          text1: "Missing information",
          text2: "Please enter your email.",
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
        text1: "Missing information",
        text2: "Please complete all fields.",
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
        text1: "Missing OTP",
        text2: "Enter the code sent to your email.",
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image source={logo} style={styles.logo} resizeMode="contain" />

          {isLogin && otpStep ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Enter the 6-digit code sent to{" "}
                  <Text style={{ ...styles.label, color: colors.primary }}>
                    {login.email}
                  </Text>
                </Text>

                <OtpInput
                  numberOfDigits={6}
                  onTextChange={setOtp}
                  theme={{
                    containerStyle: { marginTop: 20 },
                    pinCodeContainerStyle: {
                      borderColor: colors.borderColor,
                      backgroundColor: colors.background,
                    },
                    pinCodeTextStyle: { color: colors.text },
                    focusedPinCodeContainerStyle: {
                      borderColor: colors.primary,
                    },
                  }}
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.8}
                onPress={handleVerifyPress}
                disabled={verifying}
              >
                <Text style={styles.buttonText}>
                  {verifying ? "VERIFYING..." : "VERIFY & SIGN IN"}
                </Text>
              </TouchableOpacity>

              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleResend}
                  disabled={submitting}
                >
                  <Text
                    style={{ ...styles.toggleLink, color: colors.secondary }}
                  >
                    {submitting ? "Resending..." : "Resend code"}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.toggleText}> · </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={resetToLoginStart}
                >
                  <Text
                    style={{ ...styles.toggleLink, color: colors.secondary }}
                  >
                    Change email
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {!isLogin && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter Full Name"
                      placeholderTextColor={colors.lightText}
                      value={signup.fullName}
                      onChangeText={(fullName) =>
                        setSignup((prev) => ({ ...prev, fullName }))
                      }
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Phone *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter phone number"
                      placeholderTextColor={colors.lightText}
                      value={signup.phone}
                      onChangeText={(phone) =>
                        setSignup((prev) => ({ ...prev, phone }))
                      }
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Account Type *</Text>
                    <TouchableOpacity
                      style={styles.input}
                      activeOpacity={0.8}
                      onPress={() => setTypeDropdownOpen(true)}
                    >
                      <Text
                        style={{
                          color: colors.text,
                          fontFamily: fonts.regular,
                          fontSize: fontSize.md,
                        }}
                      >
                        {selectedAccountTypeLabel}
                      </Text>
                    </TouchableOpacity>

                    <Modal
                      visible={typeDropdownOpen}
                      transparent
                      animationType="fade"
                      onRequestClose={() => setTypeDropdownOpen(false)}
                    >
                      <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setTypeDropdownOpen(false)}
                      >
                        <View style={styles.dropdownMenu}>
                          {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                            <TouchableOpacity
                              key={opt.value}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setSignup((prev) => ({
                                  ...prev,
                                  accountType: opt.value,
                                }));
                                setTypeDropdownOpen(false);
                              }}
                            >
                              <Text
                                style={{
                                  color:
                                    signup.accountType === opt.value
                                      ? colors.primary
                                      : colors.text,
                                  fontFamily:
                                    signup.accountType === opt.value
                                      ? fonts.semiBold
                                      : fonts.regular,
                                  fontSize: fontSize.md,
                                }}
                              >
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </TouchableOpacity>
                    </Modal>
                  </View>
                </>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email"
                  placeholderTextColor={colors.lightText}
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
              </View>

              {/* <View style={styles.inputContainer}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor={colors.lightText}
                  secureTextEntry
                  value={isLogin ? login.password : signup.password}
                  onChangeText={(password) => {
                    if (isLogin) {
                      setLogin((prev) => ({ ...prev, password }));
                    } else {
                      setSignup((prev) => ({ ...prev, password }));
                    }
                  }}
                />
              </View> */}

              {/* {isLogin && (
                <Text
                  style={styles.forgotText}
                  onPress={() => router.navigate("/forgot-password")}
                >
                  Forgot Password?
                </Text>
              )} */}

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.8}
                onPress={handleAuthPress}
                disabled={submitting}
              >
                <Text style={styles.buttonText}>
                  {isLogin
                    ? submitting
                      ? "SIGNING IN..."
                      : "SIGN IN"
                    : submitting
                      ? "SIGNING UP..."
                      : "SIGN UP"}
                </Text>
              </TouchableOpacity>

              {/* <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {isLogin
                    ? "Don't have an account?"
                    : "Already have an account?"}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setIsLogin((prev) => !prev);
                    resetToLoginStart();
                  }}
                >
                  <Text style={styles.toggleLink}>
                    {isLogin ? " Signup" : " Login"}
                  </Text>
                </TouchableOpacity>
              </View> */}
            </>
          )}
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
    container: { flex: 1, backgroundColor: colors.background },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: "center", padding: 20 },
    logo: { width: 280, height: 75, alignSelf: "center", marginBottom: 30 },
    title: {
      fontSize: fontSize.xxl,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: "center",
      marginBottom: 25,
    },
    inputContainer: { width: "100%", marginBottom: 14 },
    input: {
      width: "100%",
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: colors.background,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 10,
      fontSize: fontSize.md,
      fontFamily: fonts.regular,
      justifyContent: "center",
    },
    label: {
      color: colors.text,
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
      marginLeft: 10,
      marginBottom: 5,
    },
    button: {
      width: "100%",
      marginTop: 20,
      marginBottom: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.primary,
      borderRadius: 10,
    },
    buttonText: {
      color: colors.background,
      textAlign: "center",
      fontSize: fontSize.md,
      fontFamily: fonts.semiBold,
    },
    forgotText: {
      fontFamily: fonts.medium,
      fontSize: fontSize.sm,
      color: colors.error,
      alignSelf: "flex-end",
      marginTop: 2,
    },
    toggleContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    toggleText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    toggleLink: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.primary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "center",
      alignItems: "center",
    },
    dropdownMenu: {
      width: "80%",
      backgroundColor: colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderColor,
      overflow: "hidden",
    },
    dropdownItem: {
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },
  });

export default Auth;
