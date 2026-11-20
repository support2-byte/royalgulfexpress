import { Text } from "@/components/ui/Text";
import { useAppTheme } from "@/hooks/useAppTheme";
import { LANGUAGES, tr, useI18n } from "@/i18n";
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { OptionRow, SheetModal } from "./Form";

export const LanguageSwitcher: React.FC = () => {
  const { colors, fontSize } = useAppTheme();
  const { lang, setLang } = useI18n();

  return (
    <View style={{ paddingVertical: 8 }}>
      <Text
        style={{
          fontSize: fontSize.xs,
          color: colors.textSecondary,
          marginBottom: 10,
        }}
      >
        {tr("Language")}
      </Text>
      <View style={[styles.segment, { backgroundColor: colors.dome }]}>
        {LANGUAGES.map((l) => {
          const active = l.code === lang;
          return (
            <TouchableOpacity
              key={l.code}
              activeOpacity={0.7}
              onPress={() => setLang(l.code)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[
                styles.pill,
                active && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: active ? "#fff" : colors.ink,
                  fontWeight: active ? "700" : "500",
                }}
              >
                {l.native}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const LanguageButton: React.FC = () => {
  const { colors, fontSize } = useAppTheme();
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={tr("Language")}
        style={[styles.globe, { backgroundColor: colors.dome }]}
      >
        <Ionicons name="globe-outline" size={16} color={colors.ink} />
        <Text style={{ fontSize: fontSize.sm, color: colors.ink }}>
          {current.native}
        </Text>
      </TouchableOpacity>

      <SheetModal
        visible={open}
        title={tr("Language")}
        onClose={() => setOpen(false)}
      >
        {LANGUAGES.map((l) => (
          <OptionRow
            key={l.code}
            title={l.native}
            selected={l.code === lang}
            onPress={() => {
              setLang(l.code);
              setOpen(false);
            }}
          />
        ))}
      </SheetModal>
    </>
  );
};

const styles = StyleSheet.create({
  segment: { flexDirection: "row", borderRadius: 14, padding: 4 },
  pill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 11,
  },
  globe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 5,
    marginRight: 10,
    borderRadius: 20,
  },
});
