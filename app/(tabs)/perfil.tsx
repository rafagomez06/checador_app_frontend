import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function PerfilScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const styles = getStyles(theme);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Mi Perfil
          </Text>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.themeToggle, { backgroundColor: theme.surface }]}
          >
            <Ionicons
              name={isDarkMode ? "sunny-outline" : "moon-outline"}
              size={22}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Perfil del Usuario */}
        <View
          style={[styles.profileContainer, { backgroundColor: theme.surface }]}
        >
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: theme.primaryLight },
            ]}
          >
            <Ionicons
              name="person-circle-outline"
              size={80}
              color={theme.primary}
            />
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>
            Juan Pérez
          </Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
            juan.perez@empresa.com
          </Text>
          <View
            style={[styles.userBadge, { backgroundColor: theme.primaryLight }]}
          >
            <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
            <Text style={[styles.badgeText, { color: theme.primary }]}>
              Verificado
            </Text>
          </View>
        </View>

        {/* Menú */}
        <View style={styles.menuContainer}>
          <Text
            style={[styles.menuSectionTitle, { color: theme.textSecondary }]}
          >
            GENERAL
          </Text>

          {/* ... Opciones del menú ... */}
          <View
            style={[
              styles.menuItem,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.menuIconContainer,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Ionicons
                name="color-palette-outline"
                size={22}
                color={theme.primary}
              />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>
              Modo Oscuro
            </Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{
                false: theme.border,
                true: theme.primary,
              }}
              thumbColor={isDarkMode ? "#FFFFFF" : "#FFFFFF"}
              ios_backgroundColor={theme.border}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos dinámicos basados en el tema
const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    themeToggle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    profileContainer: {
      alignItems: "center",
      paddingVertical: 30,
      marginHorizontal: 20,
      marginTop: 20,
      borderRadius: 20,
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
      backgroundColor: colors.primaryLight,
    },
    userName: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 4,
    },
    userEmail: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    userBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 10,
      backgroundColor: colors.primaryLight,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
      marginLeft: 4,
    },
    menuContainer: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },
    menuSectionTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: 1.5,
      marginBottom: 12,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: colors.surfaceElevated,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    menuIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.primaryLight,
    },
    menuText: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      marginLeft: 14,
      fontWeight: "500",
    },
    logoutMenuItem: {
      borderColor: colors.danger,
      backgroundColor: colors.dangerLight,
    },
    logoutText: {
      color: colors.danger,
    },
    versionText: {
      textAlign: "center",
      color: colors.textTertiary,
      fontSize: 12,
      marginTop: 20,
      letterSpacing: 0.5,
    },
  });
