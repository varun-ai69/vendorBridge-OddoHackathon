import React from "react";
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, TouchableOpacityProps, StyleProp, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

interface LoadingButtonProps extends TouchableOpacityProps {
  label: string;
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "outline";
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  label,
  isLoading = false,
  variant = "primary",
  disabled = false,
  buttonStyle,
  textStyle,
  onPress,
  ...rest
}) => {
  const { colors } = useTheme();

  const getStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          button: [styles.button, { backgroundColor: colors.secondary }, buttonStyle],
          text: [styles.text, { color: "#ffffff" }, textStyle],
          indicatorColor: "#ffffff",
        };
      case "danger":
        return {
          button: [styles.button, { backgroundColor: colors.danger }, buttonStyle],
          text: [styles.text, { color: "#ffffff" }, textStyle],
          indicatorColor: "#ffffff",
        };
      case "outline":
        return {
          button: [styles.button, styles.outline, { borderColor: colors.primary }, buttonStyle],
          text: [styles.text, { color: colors.primary }, textStyle],
          indicatorColor: colors.primary,
        };
      case "primary":
      default:
        return {
          button: [styles.button, { backgroundColor: colors.primary }, buttonStyle],
          text: [styles.text, { color: "#ffffff" }, textStyle],
          indicatorColor: "#ffffff",
        };
    }
  };

  const styleConfigs = getStyles();
  const isButtonDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styleConfigs.button,
        isButtonDisabled && { opacity: 0.6 },
      ]}
      disabled={isButtonDisabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: isButtonDisabled }}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={styleConfigs.indicatorColor} />
      ) : (
        <Text style={styleConfigs.text}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48, // 44pt minimum touch target
    minWidth: 100,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
