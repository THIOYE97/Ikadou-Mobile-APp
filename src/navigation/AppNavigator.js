import React, { useState, useEffect } from 'react';
import { View, Text, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { subscribeAuthRequired } from '../lib/authEvents';

// Screens
import AuthRequiredScreen from '../screens/AuthRequiredScreen';
import LogoSplashScreen from '../screens/LogoSplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import CatalogueScreen from '../screens/CatalogueScreen';
import MapViewScreen from '../screens/MapViewScreen';
import TerrainDetailScreen from '../screens/TerrainDetailScreen';
import ContactAgentScreen from '../screens/ContactAgentScreen';
import BookVisitScreen from '../screens/BookVisitScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SimulatorScreen from '../screens/SimulatorScreen';
import LeadCaptureScreen from '../screens/LeadCaptureScreen';
import MyPaymentsScreen from '../screens/MyPaymentsScreen';
import PaymentReferenceScreen from '../screens/PaymentReferenceScreen';
import CreatePaymentScreen from '../screens/CreatePaymentScreen';
import PaymentProofScreen from '../screens/PaymentProofScreen';
import SupportTicketScreen from '../screens/SupportTicketScreen';
import SupportFab from '../components/SupportFab';
import BootstrapScreen from '../screens/BootstrapScreen';
import SupportHomeScreen from '../screens/SupportHomeScreen';
import SupportNewTicketScreen from '../screens/SupportNewTicketScreen';
import MyVisitsScreen from '../screens/MyVisitsScreen';
import RegisterDetailsScreen from '../screens/RegisterDetailsScreen';
import CGUScreen from '../screens/CGUScreen';
import ConfidentialiteScreen from '../screens/ConfidentialiteScreen';
import ProjectsHomeScreen from '../screens/ProjectsHomeScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ProjectDetailsScreen from '../screens/ProjectDetailsScreen';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const DiscoverStack = createNativeStackNavigator();
const ProjectStack = createNativeStackNavigator();
const AccountStack = createNativeStackNavigator();

export const navigationRef = createNavigationContainerRef();

const BRAND = {
  bg: '#F7F4EF',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#6F6B64',
  border: '#E9E2D8',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.10)',
  orange: '#F28C28',
};

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: BRAND.bg,
    card: BRAND.white,
    text: BRAND.text,
    border: BRAND.border,
    primary: BRAND.teal,
  },
};

const IMMERSIVE_ROUTES = new Set([
  'TerrainDetail',
  'MapView',
  'Simulator',
  'LeadCapture',
  'ContactAgent',
  'BookVisit',
  'CreatePayment',
  'PaymentReference',
  'PaymentProof',
  'SupportTicket',
  'SupportHome',
  'SupportNewTicket',
  'Login',
  'Register',
  'RegisterDetails',
  'AuthRequired',
  'CGU',
  'Confidentialite',
  'MyPayments',
  'MyVisits',
  'ProjectDetails',
]);

function getDeepestRoute(route) {
  let current = route;

  while (current?.state && current.state.index != null) {
    current = current.state.routes[current.state.index];
  }

  return current;
}

function shouldHideSupportFabFromRoute(rootRoute) {
  const current = getDeepestRoute(rootRoute);
  const routeName = current?.name;
  return IMMERSIVE_ROUTES.has(routeName);
}

function shouldHideTabBar(route) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? '';

  if (!routeName) return false;

  return IMMERSIVE_ROUTES.has(routeName);
}

function TabIcon({ icon, label, focused }) {
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      <Ionicons
        name={icon}
        size={18}
        color={focused ? BRAND.teal : BRAND.textSoft}
        style={{ marginBottom: 3 }}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

function DiscoverStackNavigator() {
  return (
    <DiscoverStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BRAND.bg },
        animation: 'slide_from_right',
      }}
    >
      <DiscoverStack.Screen name="DiscoverHome" component={CatalogueScreen} />
      <DiscoverStack.Screen name="TerrainDetail" component={TerrainDetailScreen} />
      <DiscoverStack.Screen name="MapView" component={MapViewScreen} />
    </DiscoverStack.Navigator>
  );
}

function ProjectStackNavigator() {
  return (
    <ProjectStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BRAND.bg },
        animation: 'slide_from_right',
      }}
    >
      <ProjectStack.Screen name="ProjectHome" component={ProjectsHomeScreen} />
      <ProjectStack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />
      <ProjectStack.Screen name="Simulator" component={SimulatorScreen} />
      <ProjectStack.Screen
        name="LeadCapture"
        component={LeadCaptureScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <ProjectStack.Screen
        name="ContactAgent"
        component={ContactAgentScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <ProjectStack.Screen
        name="BookVisit"
        component={BookVisitScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <ProjectStack.Screen name="TerrainDetail" component={TerrainDetailScreen} />
      <ProjectStack.Screen name="MapView" component={MapViewScreen} />
      <ProjectStack.Screen name="PaymentReference" component={PaymentReferenceScreen} />
      <ProjectStack.Screen name="PaymentProof" component={PaymentProofScreen} />
      <ProjectStack.Screen name="CreatePayment" component={CreatePaymentScreen} />
      
    </ProjectStack.Navigator>
  );
}

function AccountStackNavigator() {
  return (
    <AccountStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BRAND.bg },
        animation: 'slide_from_right',
      }}
    >
      <AccountStack.Screen name="AccountHome" component={ProfileScreen} />
      <AccountStack.Screen name="Login" component={LoginScreen} />
      <AccountStack.Screen name="Register" component={RegisterScreen} />
      <AccountStack.Screen name="RegisterDetails" component={RegisterDetailsScreen} />
      <AccountStack.Screen name="MyVisits" component={MyVisitsScreen} />
      <AccountStack.Screen name="CGU" component={CGUScreen} />
      <AccountStack.Screen name="Confidentialite" component={ConfidentialiteScreen} />
      <AccountStack.Screen name="MyPayments" component={MyPaymentsScreen} />
      <AccountStack.Screen name="SupportTicket" component={SupportTicketScreen} />
      <AccountStack.Screen name="PaymentReference" component={PaymentReferenceScreen} />
      <AccountStack.Screen name="PaymentProof" component={PaymentProofScreen} />
      <AccountStack.Screen name="CreatePayment" component={CreatePaymentScreen} />
      <AccountStack.Screen name="SupportHome" component={SupportHomeScreen} />
      <AccountStack.Screen name="SupportNewTicket" component={SupportNewTicketScreen} />
      <AccountStack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <AccountStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
<AccountStack.Screen name="ResetPassword" component={ResetPasswordScreen} />

    </AccountStack.Navigator>
  );
}

function MainTabs({ hideSupportFab = false }) {
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom;
  const tabBarHeight = 66 + bottomInset;

  const sharedTabBarStyle = {
    height: tabBarHeight,
    paddingTop: 8,
    paddingBottom: bottomInset,
    backgroundColor: BRAND.white,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen
          name="DiscoverTab"
          component={DiscoverStackNavigator}
          options={({ route }) => ({
            tabBarStyle: shouldHideTabBar(route)
              ? { display: 'none' }
              : sharedTabBarStyle,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="home-outline" label="Découvrir" focused={focused} />
            ),
          })}
        />

        <Tab.Screen
          name="ProjectTab"
          component={ProjectStackNavigator}
          options={({ route }) => ({
            tabBarStyle: shouldHideTabBar(route)
              ? { display: 'none' }
              : sharedTabBarStyle,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="card-outline" label="Projet" focused={focused} />
            ),
          })}
        />

        <Tab.Screen
          name="AccountTab"
          component={AccountStackNavigator}
          options={({ route }) => ({
            tabBarStyle: shouldHideTabBar(route)
              ? { display: 'none' }
              : sharedTabBarStyle,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="person-outline" label="Compte" focused={focused} />
            ),
          })}
        />
      </Tab.Navigator>

      {!hideSupportFab ? <SupportFab /> : null}
    </View>
  );
}

export default function AppNavigator({ initialRoute = 'LogoSplash' }) {
  const [hideSupportFab, setHideSupportFab] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAuthRequired((payload) => {
      if (!navigationRef.isReady()) return;

      navigationRef.navigate('AuthRequired', {
        title: payload?.title,
        message: payload?.message,
      });
    });

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer
      theme={navTheme}
      ref={navigationRef}
      onStateChange={() => {
        const rootRoute = navigationRef.getCurrentRoute();
        setHideSupportFab(shouldHideSupportFabFromRoute(rootRoute));
      }}
    >
      <RootStack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: BRAND.bg },
          animation: 'slide_from_right',
        }}
      >
        <RootStack.Screen
          name="LogoSplash"
          component={LogoSplashScreen}
          options={{ animation: 'fade', gestureEnabled: false }}
        />

        <RootStack.Screen
          name="Bootstrap"
          component={BootstrapScreen}
          options={{ animation: 'fade', gestureEnabled: false }}
        />

        <RootStack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ animation: 'fade', gestureEnabled: false }}
        />

        <RootStack.Screen
          name="Main"
          options={{ animation: 'fade', gestureEnabled: false }}
        >
          {() => <MainTabs hideSupportFab={hideSupportFab} />}
        </RootStack.Screen>

        <RootStack.Screen name="AuthRequired" component={AuthRequiredScreen} />
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Register" component={RegisterScreen} />
        <RootStack.Screen name="RegisterDetails" component={RegisterDetailsScreen} />
        <RootStack.Screen name="MyPayments" component={MyPaymentsScreen} />
        <RootStack.Screen name="SupportTicket" component={SupportTicketScreen} />
        <RootStack.Screen name="SupportHome" component={SupportHomeScreen} />
        <RootStack.Screen name="SupportNewTicket" component={SupportNewTicketScreen} />
        <RootStack.Screen name="PaymentReference" component={PaymentReferenceScreen} />
        <RootStack.Screen name="PaymentProof" component={PaymentProofScreen} />
        <RootStack.Screen name="CreatePayment" component={CreatePaymentScreen} />
        <RootStack.Screen name="Simulator" component={SimulatorScreen} />
        <RootStack.Screen name="MyVisits" component={MyVisitsScreen} />
        <RootStack.Screen name="TerrainDetail" component={TerrainDetailScreen} />
        <RootStack.Screen name="MapView" component={MapViewScreen} />
        <RootStack.Screen name="CGU" component={CGUScreen} />
        <RootStack.Screen name="Confidentialite" component={ConfidentialiteScreen} />
        <RootStack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
<RootStack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        <RootStack.Screen
          name="LeadCapture"
          component={LeadCaptureScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <RootStack.Screen
          name="ContactAgent"
          component={ContactAgentScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <RootStack.Screen
          name="BookVisit"
          component={BookVisitScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

function PlaceholderScreen(title) {
  return function Placeholder({ navigation }) {
    return (
      <View style={styles.placeholderWrap}>
        <View style={styles.placeholderIconWrap}>
          <Ionicons name="construct-outline" size={28} color={BRAND.teal} />
        </View>

        <Text style={styles.placeholderTitle}>{title}</Text>
        <Text style={styles.placeholderSub}>Écran en cours de développement</Text>

        <TouchableOpacity
          style={styles.placeholderBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.9}
        >
          <Text style={styles.placeholderBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 86,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },

  tabIconWrapActive: {
    backgroundColor: BRAND.tealSoft,
  },

  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND.textSoft,
  },

  tabLabelActive: {
    color: BRAND.teal,
    fontWeight: '800',
  },

  placeholderWrap: {
    flex: 1,
    backgroundColor: BRAND.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  placeholderIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  placeholderTitle: {
    color: BRAND.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },

  placeholderSub: {
    color: BRAND.textSoft,
    fontSize: 13,
    marginBottom: 18,
    textAlign: 'center',
  },

  placeholderBtn: {
    minHeight: 46,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});