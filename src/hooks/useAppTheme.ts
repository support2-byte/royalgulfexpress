import { Colors, FontSize, Fonts } from "@/constants/theme";

export const useAppTheme = () => {
  const mode = "light" as const;

  return {
    mode,

    colors: {
      ...Colors[mode],
      success: Colors.success,
      error: Colors.error,
      warning: Colors.warning,
      info: Colors.info,
    },

    fonts: Fonts,
    fontSize: FontSize,
  };
};
