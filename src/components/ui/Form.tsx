import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { StyleSheet, TextInputProps, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "@/components/ui/Text";
import BottomSheet from "./BottomSheet";

export const FormLabel: React.FC<{ children: string }> = ({ children }) => {
  const { colors, fontSize, fonts } = useAppTheme();
  return (
    <Text
      style={{
        fontFamily: fonts.bold,
        fontSize: fontSize.md,
        color: colors.ink,
        marginTop: 26,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
};

interface SelectProps {
  icon: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
}

export const SelectField: React.FC<SelectProps> = ({
  icon,
  value,
  placeholder,
  onPress,
  disabled,
}) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = StyleSheet.create({
    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      height: 54,
      paddingHorizontal: 18,
      borderRadius: 27,
      backgroundColor: colors.surface,
      opacity: disabled ? 0.55 : 1,
      marginBottom: 8,
    },
    text: {
      flex: 1,
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: value ? colors.ink : colors.lightText,
    },
  });
  return (
    <TouchableOpacity
      style={styles.field}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon as any} size={18} color={colors.textSecondary} />
      <Text style={styles.text} numberOfLines={1}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

interface TextFieldProps extends TextInputProps {
  icon: string;
}

export const TextField: React.FC<TextFieldProps> = ({ icon, style, ...rest }) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = StyleSheet.create({
    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      height: 54,
      paddingHorizontal: 18,
      borderRadius: 27,
      backgroundColor: colors.surface,
      marginBottom: 8,
    },
    input: {
      flex: 1,
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.ink,
      padding: 0,
    },
  });
  return (
    <View style={styles.field}>
      <Ionicons name={icon as any} size={18} color={colors.textSecondary} />
      <TextInput
        placeholderTextColor={colors.lightText}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
};

export const CheckBox: React.FC<{ checked: boolean }> = ({ checked }) => {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: checked ? colors.primary : "transparent",
        borderWidth: checked ? 0 : 1.5,
        borderColor: colors.borderColor,
      }}
    >
      {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
    </View>
  );
};

export const SummaryRow: React.FC<{
  label: string;
  value: string;
  strong?: boolean;
}> = ({ label, value, strong }) => {
  const { colors, fontSize, fonts } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        paddingVertical: strong ? 14 : 9,
      }}
    >
      <Text
        style={{
          fontFamily: strong ? fonts.bold : fonts.regular,
          fontSize: strong ? fontSize.md : fontSize.sm,
          color: strong ? colors.ink : colors.textSecondary,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          flexShrink: 1,
          fontFamily: fonts.bold,
          fontSize: strong ? fontSize.xl : fontSize.sm,
          color: strong ? colors.primary : colors.ink,
          letterSpacing: strong ? -0.4 : 0,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
};

interface SheetModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const SheetModal: React.FC<SheetModalProps> = ({
  visible,
  title,
  onClose,
  children,
}) => (
  <BottomSheet visible={visible} title={title} onClose={onClose}>
    {children}
  </BottomSheet>
);

export const OptionRow: React.FC<{
  title: string;
  subtitle?: string;
  selected?: boolean;
  checkbox?: boolean;
  onPress: () => void;
}> = ({ title, subtitle, selected, checkbox, onPress }) => {
  const { colors, fontSize, fonts } = useAppTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.hairline,
      }}
    >
      {checkbox && <CheckBox checked={!!selected} />}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: selected ? fonts.bold : fonts.semiBold,
            fontSize: fontSize.md,
            color: selected && !checkbox ? colors.primary : colors.ink,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: fontSize.xs,
              color: colors.textSecondary,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {!checkbox && selected && (
        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
};
