import { api } from "@/api";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const ForgotPassword = () => {
  const { colors, fontSize, fonts } = useAppTheme();
  const [email, setEmail] = useState<string>("");
  const [isSent, setIsSent] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const styles = createStyles(colors, fontSize, fonts);

  const handleOTP = async () => {
    setLoading(true);
    try {
      const response = await api.post("/auth/sendOTP", { email });
      if (response.data.success) {
        setIsSent(true);
        Toast.show({
          type: "success",
          text1: response.data?.message,
        });
      } else {
        setIsSent(false);
        Toast.show({
          type: "error",
          text1: response.data?.message,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error?.message,
      });
    } finally {
      setLoading(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.form}>
          <Text style={styles.title}>Forgot Password</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              inputMode="email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={handleOTP}
            disabled={loading}
          >
            <Text style={styles.buttonText}>SEND OTP</Text>
          </TouchableOpacity>
        </View>
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
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    keyboardView: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
    },

    form: {
      width: "100%",
      maxWidth: 500,
      alignSelf: "center",
    },

    title: {
      fontSize: fontSize.xxl,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: "center",
      marginBottom: 30,
    },

    inputContainer: {
      width: "100%",
      marginBottom: 14,
    },

    label: {
      color: colors.text,
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
      marginLeft: 10,
      marginBottom: 5,
    },

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
    },

    button: {
      width: "100%",
      marginTop: 20,
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
  });

export default ForgotPassword;
