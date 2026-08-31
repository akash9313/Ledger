import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../../features/notes/screens/HomeScreen';
import NoteDetailScreen from '../../features/notes/screens/NoteDetailScreen';
import SettingsScreen from '../../features/settings/screens/SettingsScreen';
import RecentlyDeletedScreen from '../../features/notes/screens/RecentlyDeletedScreen';
import SplashScreen from '../../features/splash/screens/SplashScreen';
import AuthScreen from '../../features/auth/screens/AuthScreen';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Auth: undefined;
  NoteDetail: { noteId?: string };
  Settings: undefined;
  RecentlyDeleted: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerStyle: { backgroundColor: '#1E1E1E' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen 
        name="Splash" 
        component={SplashScreen} 
        options={{ headerShown: false, animation: 'fade' }} 
      />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Auth" 
        component={AuthScreen} 
        options={{ headerShown: false, animation: 'slide_from_bottom' }} 
      />
      <Stack.Screen 
        name="NoteDetail" 
        component={NoteDetailScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="RecentlyDeleted" 
        component={RecentlyDeletedScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
