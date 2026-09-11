import React from 'react';

import { StyleSheet, StatusBar } from 'react-native';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import SplashScreen from './src/Screens/SplashScreen';
import LoginScreen from './src/Screens/LoginScreen';
import OtpScreen from './src/Screens/OtpAuthScreen';
import HomeScreen from './src/Screens/HomeScreen';
import BookingScreen from './src/Screens/BookingScreen';
import CheckInScanScreen from './src/Screens/CheckInScanScreen';
import WalletScreen from './src/Screens/WalletScreen';
import ProfileScreen from './src/Screens/ProfileScreen';
import RewardsScreen from './src/Screens/RewardsScreen';
import ChatScreen from './src/Components/Booking/ChatScreen';


import Taxiscreen from './src/Components/HomeScreens/TaxiScreen';
import DriveWithUs from './src/Components/HomeScreens/DriveWithUs';
import HomeStaysScreen from './src/Components/BookingScreens/HomeStaysScreen';
import HotelsScreen from './src/Components/BookingScreens/HotelsScreen';
import ResortScreen from './src/Components/BookingScreens/ResortScreen';
import RestaurantsScreen from './src/Components/BookingScreens/RestaurantsScreen';
import CoffeCorner from './src/Components/BookingScreens/CoffeCorner';
import TpPassScreen from './src/Components/HomeScreens/TpPassScreen';
import InsuranceScreen from './src/Components/HomeScreens/InsuranceScreen';
import AllHotels from './src/Components/HomeScreens/AllHotelsCategories';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: {active: 'home', inactive: 'home-outline'},
  Booking: {active: 'calendar', inactive: 'calendar-outline'},
  Wallet: {active: 'wallet', inactive: 'wallet-outline'},
  Rewards: {active: 'gift', inactive: 'gift-outline'},
  Profile: {active: 'person', inactive: 'person-outline'},
};

// Hoisted to a stable reference so screenOptions (re-created on every
// MainTabs render) doesn't hand react-navigation a brand new component
// type per tab press.
const TabBarIcon = ({routeName, focused, color}) => (
  <Icon
    name={focused ? TAB_ICONS[routeName].active : TAB_ICONS[routeName].inactive}
    size={26}
    color={color}
  />
);

const MainTabs = () => {
  // useSafeAreaInsets (not the plain SafeAreaView) because we need the raw
  // bottom inset value to size the tab bar itself — it varies by device
  // (iPhone home indicator, Android 3-button vs. gesture nav, or 0 on
  // older phones) and a fixed height would either clip content behind the
  // home indicator or leave the bar looking oversized where there's no inset.
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({

        headerShown: false,
        // Stops a blurred tab (e.g. Home with its several horizontal
        // FlatLists) from continuing to re-render in the background —
        // without this, every tab press was paying for work happening on
        // whichever tab you'd just left, which is what made switching feel
        // laggy.
        freezeOnBlur: true,
        tabBarActiveTintColor: '#0057FF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.bottomBar,
          {
            height: 50 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ],

        tabBarIcon: ({ focused, color }) => (
          <TabBarIcon routeName={route.name} focused={focused} color={color} />
        ),
      })}
    >

      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Booking" component={BookingScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />

    </Tab.Navigator>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      {/* Sane baseline for every screen that doesn't set its own (Splash,
          Login, OTP, and the plain white tab stubs). Screens that need a
          different style (Home, Taxi, Hotels) set/restore their own. */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <NavigationContainer>

        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        >

          <Stack.Screen name="Splash" component={SplashScreen} />

          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OtpAuth" component={OtpScreen} />
                    <Stack.Screen name="ChatScreen" component={ChatScreen} />

          <Stack.Screen
            name="Taxi"
            component={Taxiscreen}
            // Rapido/Uber-style: the booking flow slides up from the
            // bottom as a modal sheet over Home, instead of the plain
            // left-right push every other screen in this stack uses.
            options={{presentation: 'modal', animation: 'slide_from_bottom'}}
          />
          <Stack.Screen name="Hotels" component={HotelsScreen} />
          <Stack.Screen name="HomeStays" component={HomeStaysScreen} />
          <Stack.Screen name="Resort" component={ResortScreen} />
          <Stack.Screen name="Restaurants" component={RestaurantsScreen} />
          <Stack.Screen name="CoffeCorner" component={CoffeCorner} />
          <Stack.Screen name="Insurance" component={InsuranceScreen} />
          <Stack.Screen name="AllHotels" component={AllHotels} />
          <Stack.Screen
            name="CheckInScan"
            component={CheckInScanScreen}
            options={{presentation: 'fullScreenModal', animation: 'slide_from_bottom'}}
          />

          <Stack.Screen name="MainTabs" component={MainTabs} />

        </Stack.Navigator>

      </NavigationContainer>

    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E2E8',
    paddingTop: 10,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
  },
});

export default App;
