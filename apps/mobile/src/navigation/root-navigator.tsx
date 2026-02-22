import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import AuthNavigator from './auth-navigator';
import MainNavigator from './main-navigator';
import LoadingScreen from '../screens/loading-screen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
