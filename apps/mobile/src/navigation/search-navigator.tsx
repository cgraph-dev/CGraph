/**
 * Stack navigator for the search section.
 * @module navigation/search-navigator
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../types';
import SearchScreen from '../screens/search/search-screen';

const Stack = createNativeStackNavigator<SearchStackParamList>();

/**
 *
 */
export default function SearchNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SearchMain" component={SearchScreen} />
    </Stack.Navigator>
  );
}
