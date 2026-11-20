import { Colors, FontSize, Fonts, type FontSet } from "@/constants/theme";
import { useI18n } from "@/i18n";

// Reddit Sans is Latin-only, so Arabic and Urdu use Noto Sans Arabic.
const ArabicFonts: FontSet = {
  regular: "NotoSansArabic-Regular",
  medium: "NotoSansArabic-Medium",
  semiBold: "NotoSansArabic-SemiBold",
  bold: "NotoSansArabic-Bold",
};

export const useAppTheme = () => {
  const mode = "light" as const;
  // Subscribing to the language context re-renders every themed component
  // when the language changes.
  const { lang, isRTL } = useI18n();

  return {
    mode,
    lang,
    isRTL,

    colors: {
      ...Colors[mode],
      success: Colors.success,
      error: Colors.error,
      warning: Colors.warning,
      info: Colors.info,
    },

    fonts: (isRTL ? ArabicFonts : Fonts) as FontSet,
    fontSize: FontSize,
  };
};
