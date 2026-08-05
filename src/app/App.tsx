import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from '../core/navigation/RootNavigator';

const linking = {
  prefixes: ['ledger://'],
  config: {
    screens: {
      Home: 'home',
      NoteDetail: 'note/:noteId?',
      Settings: 'settings',
    },
  },
};

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
