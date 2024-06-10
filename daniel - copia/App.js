import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './AuthContext';
import { StatusBar } from 'react-native';
import { MaterialIcons, Octicons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LogIn from './src/screens/LogInScreen';
// import Index from './src/screens/IndexScreen';
// import ScheduleScreen from './src/screens/ScheduleScreen';
import Principal from './src/screens/PrincipalScreen';
// import Faltas from './src/screens/FaltasScreen';
import FaltasScreen from './src/screens/FaltasScreen';
import ColorRatation from './src/components/ColorRotation';
import DetectorApp from './src/screens/App';
import colors from './src/styles/Colors';
import CrearAsignaturaScreen from './src/screens/CrearAsignaturaScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const PrincipalStack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="LogIn" component={LogIn} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function AppTabs(){
  const [elegirCargo, setElegirCargo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerElegirCargo = async () => {
      const cargo = await AsyncStorage.getItem('elegirCargo');
      setElegirCargo(cargo);
      setLoading(false);
    }
    obtenerElegirCargo();
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PrincipalStack.Navigator>
      {
        elegirCargo=="alumno" ? 
        <PrincipalStack.Screen name="Sirac" component={Principal} options={{ headerShown: false }} /> :
        <>
        <PrincipalStack.Screen name="DetectorApp" component={DetectorApp} options={{ headerShown: false }} />
        <PrincipalStack.Screen name="CrearAsignaturaScreen" component={CrearAsignaturaScreen} options={{ headerShown: false }} />
        </>
      }
      {/* <PrincipalStack.Screen name="Sirac" component={Principal} options={{ headerShown: false }} /> */}
      {/* <PrincipalStack.Screen name="Faltas" component={FaltasScreen} options={{ headerShown: false }} /> */}
      {/* <PrincipalStack.Screen name="ColorRatation" component={ColorRatation} options={{ headerShown: false }} /> */}
    </PrincipalStack.Navigator>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" hidden={false} />
      {isAuthenticated ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWrapper;