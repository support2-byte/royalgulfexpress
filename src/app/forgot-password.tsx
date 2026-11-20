import { tr } from "@/i18n";
import { api } from "@/api";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Form";
import Header, { useSheetStyle } from "@/components/ui/Header";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const ForgotPassword = () => {
  const { colors, fontSize, fonts } = useAppTheme();
  const [email, setEmail] = useState<string>("");
  const [isSent, setIsSent] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const styles = createStyles(colors, fontSize, fonts);
  const sheet = useSheetStyle();

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
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <Header
        name="Forgot password"
        description={tr("We'll email you a one-time code to get back in")}
        icon="key"
      />
      <KeyboardAvoidingView
        style={sheet}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.form}>
          <TextField
            icon="mail-outline"
            placeholder={tr("Email address")}
            value={email}
            onChangeText={setEmail}
            inputMode="email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            style={styles.button}
            label={isSent ? "Code sent" : "Send code"}
            icon={isSent ? "checkmark" : "paper-plane-outline"}
            loading={loading}
            disabled={!email.trim()}
            onPress={handleOTP}
          />
          {isSent && (
            <Text style={styles.hint}>{tr("Check your inbox for the code.")}</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    form: { width: "100%", maxWidth: 500, alignSelf: "center", padding: 24, paddingTop: 32 },
    button: { marginTop: 12 },
    hint: {
      fontFamily: fonts.medium,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 16,
    },
  });

export default ForgotPassword;
