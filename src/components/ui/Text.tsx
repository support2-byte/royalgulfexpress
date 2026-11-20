import { tr, useI18n } from "@/i18n";
import React, { forwardRef } from "react";
import {
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from "react-native";

const translate = (child: React.ReactNode): React.ReactNode => {
  if (typeof child === "string") return tr(child);
  if (Array.isArray(child)) return child.map(translate);
  return child;
};

/**
 * Drop-in Text that translates plain-string children through the dictionary.
 * Strings without a translation (names, numbers, booking refs) pass through
 * untouched, so it is safe for dynamic content.
 */
export const Text = forwardRef<RNText, TextProps>(({ children, ...rest }, ref) => {
  useI18n(); // re-render on language change
  return (
    <RNText ref={ref} {...rest}>
      {translate(children)}
    </RNText>
  );
});
Text.displayName = "Text";

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ placeholder, ...rest }, ref) => {
    useI18n();
    return (
      <RNTextInput
        ref={ref}
        placeholder={placeholder ? tr(placeholder) : placeholder}
        {...rest}
      />
    );
  },
);
TextInput.displayName = "TextInput";
