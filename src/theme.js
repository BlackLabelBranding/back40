import { MD3LightTheme as DefaultTheme } from "react-native-paper";

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#367C2B", // John Deere-ish green
    secondary: "#6B4F2A", // earthy brown
    tertiary: "#F2C200", // warm yellow accent
    background: "#0B0F0A",
    surface: "#121A12",
    surfaceVariant: "#172217",
    outline: "#2A3B2A",
    onSurface: "#EAF2EA",
    onBackground: "#EAF2EA",
  },
  roundness: 16,
};
