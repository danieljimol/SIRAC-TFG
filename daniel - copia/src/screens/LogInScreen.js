import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, Dimensions, ImageBackground, TouchableOpacity, Pressable, ActivityIndicator, SafeAreaView, Image, Platform
} from 'react-native';
import { GoogleSignin, statusCodes, GoogleSigninButton } from '@react-native-google-signin/google-signin';
// import axios from 'axios';
import axios from '../api/axiosConfig';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../AuthContext';
import { NativeModules } from 'react-native';
const { BleModule } = NativeModules;
import { StatusBar } from 'react-native';
import colors from '../styles/Colors';
import { AntDesign } from '@expo/vector-icons';

const LogIn = ({ navigation }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [correoNoValido, setCorreoNoValido] = useState(false);
  const [uuidBle, setUUIDBLE] = useState("");
  const [alumnoId, setAlumnoId] = useState("");
  const [cargando, setCargando] = useState(true);
  const [elegirCargo, setElegirCargo] = useState("");

  const { signIn, signOut, isAuthenticated } = useAuth();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: webClientId,
    });
    getCurrentUserInfo();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const bluetoothPermission = Platform.OS === 'ios' ? PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    const bluetoothAdvertisePermission = Platform.OS === 'ios' ? PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL : PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE;
    const locationPermission = Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    const ACCESS_BACKGROUND_LOCATION = Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION;
    const FOREGROUND_SERVICE = Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.FOREGROUND_SERVICE;

    const bluetoothStatus = await request(bluetoothPermission);
    const bluetoothAdvertiseStatus = await request(bluetoothAdvertisePermission);
    const locationStatus = await request(locationPermission);
    const ACCESS_BACKGROUND_LOCATIONStatus = await request(ACCESS_BACKGROUND_LOCATION);
    const FOREGROUND_SERVICEStatus = await request(FOREGROUND_SERVICE);

    if (bluetoothStatus === RESULTS.GRANTED && locationStatus === RESULTS.GRANTED && bluetoothAdvertisePermission === RESULTS.GRANTED) {
      console.log('Bluetooth and Location permissions granted');
    } else {
      // console.log('Permissions not granted');
    }
  };

  // Inicio de sesión con Google
  const webClientId = "220139447482-166cfpegh696qpitae14epcv96qplh0r.apps.googleusercontent.com";

  const getCurrentUserInfo = async () => {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      setUserInfo(userInfo);
      setLoggedIn(true);
    } catch (error) {
    } finally {
      setCargando(false);
    }
  };

  const googleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      await verifyTokenWithServer(userInfo);
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login process');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available or outdated');
      } else {
        console.log('Some other error happened', error);
      }
    }
  };

  const googleSignOut = async () => {
    try {
      await GoogleSignin.signOut();
      setLoggedIn(false);
      setUserInfo(null);
      AsyncStorage.setItem('userLogged', 'false');
      signOut();
    } catch (error) {
      console.error('Error al cerrar sesión' ,error);
    }
  };

  const obtenerAlumno = async (uuidBLE) => {
    try {
      const response = await axios.get(`/alumnos/uuidble/${uuidBLE}`);
      const { data } = response;
      AsyncStorage.setItem('alumnoId', `${data.id}`);
      setAlumnoId(data.id);
    } catch (error) {
      console.error('Error al obtener el alumno', error);
    }
  }

  const obtenerUUIDBLE = async () => {
    try {
      const correoLogeado = await AsyncStorage.getItem('userEmail');
      const response = await axios.get(`/alumnos/email/${correoLogeado}`);
      const { data } = response;
      setUUIDBLE(data.uuidBLE);

      BleModule.scheduleClassAttendanceWorks(data.uuidBLE);
      obtenerAlumno(data.uuidBLE);
    } catch (error) {

    }
  }

  const verifyTokenWithServer = async (userInfo) => {
    try {
      const idToken = userInfo.idToken;

      const response = await axios.post('/signin/verify-google-token', { token: idToken, cargo: elegirCargo });
      // Si el servidor responde correctamente (200 OK)
      if (response.status === 200) {
        const { data } = response;

        console.log('User data', data);

        console.log('userToken ' + data.token);
        console.log('userName ' + userInfo.user.name);
        console.log('userEmail ' + userInfo.user.email);
        console.log('userPicture ' + userInfo.user.photo);

        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userName', userInfo.user.name);
        await AsyncStorage.setItem('userEmail', userInfo.user.email);
        await AsyncStorage.setItem('userPicture', userInfo.user.photo);
        AsyncStorage.setItem('userLogged', 'true');

        AsyncStorage.getItem('userToken').then(token => {
          console.log('Token almacenado con éxito: ', token);
        }).catch(error => {
          console.error('Error al recuperar el token', error);
        });

        await AsyncStorage.setItem('userLogged', 'true');
        console.log("Usuario logueado " + await AsyncStorage.getItem('userLogged'));
        setLoggedIn(true);
        setUserInfo(userInfo);
        setCorreoNoValido(false);

        obtenerUUIDBLE();

        signIn(data.token);
      } else {
        console.log('Respuesta del servidor:', response.status, response.data.error);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Dominio del correo no permitido:', error.response.data.error);
        setCorreoNoValido(true);
      } else {
        console.log('Error aquí', error.message);
      }
      setLoggedIn(false);
      setUserInfo(null);
      googleSignOut();
    }
  };

  const formatText = (text) => {
    return text.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const elegirCargoFunction = async (cargo) => {
    setElegirCargo(cargo);
    await AsyncStorage.setItem('elegirCargo', cargo);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={false} translucent={false} />
        <View style={styles.loginContainer}>
          <StatusBar backgroundColor={colors.background} hidden={false} />
          <View style={styles.logoSloganContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.textoLogo}>SIRAC</Text>
            </View>
            <Text style={styles.welcomeText}>Registra cada asistencia</Text>
          </View>
          <View style={styles.profesorAlumnoContainer}>
            <TouchableOpacity onPress={() => elegirCargoFunction("alumno")}>
              <View style={elegirCargo=="alumno" ? styles.imagenTextoContainerSelected : styles.imagenTextoContainer}>
                <Image
                  source={require('../assets/8190934.jpg')}
                  style={styles.image}
                />
                <Text style={styles.soyText}>Soy alumno</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => elegirCargoFunction("profesor")}>
              <View style={elegirCargo=="profesor" ? styles.imagenTextoContainerSelected : styles.imagenTextoContainer}>
                <Image
                  source={require('../assets/78537599_9829626.jpg')}
                  style={styles.image}
                />
                <Text style={styles.soyText}>Soy profesor</Text>
              </View>
            </TouchableOpacity>
          </View>
          {
            elegirCargo ? 
            <View style={styles.botonGoogleContainer}>
              {correoNoValido ?
                <Text style={styles.errorText}>Correo no válido</Text> :
                <Text style={styles.errorTextNoVisible}>Correo no válido</Text>
              }
              <Text style={styles.buttonTextLogin}>Iniciar sesión</Text>
              <TouchableOpacity onPress={googleLogin} style={styles.loginButton}>
                <AntDesign name="google" size={22} color='#fff' />
                <View style={styles.separador}></View>
                <Text style={styles.buttonTextLogin}>Continuar con Google</Text>
              </TouchableOpacity>
            </View> :
            <View style={styles.invisible}></View>
          }
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: colors.background
  },
  logoSloganContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  logoContainer: {
    backgroundColor: colors.icono,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  textoLogo: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: 'bold'
  },
  profesorAlumnoContainer: {

  },
  imagenTextoContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 5,
    borderColor: 'rgba(1, 1, 1, 0)',
  },
  imagenTextoContainerSelected: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#fff',
    borderRadius: 20,
    marginBottom: 20
  },
  image: {
    width: 180,
    height: 180,
    borderRadius: 10,
    // padding: 100
    margin: 5,
  },
  soyText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: 24,
    backgroundColor: 'rgba(247, 243, 238, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    position: 'absolute',
    bottom: 20
  },
  botonGoogleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  invisible: {
    height: 115,
    width: 20,
  },
  cuentaInstitucionalText: {
    textAlign: 'center',
    color: colors.icono
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '400',
    textAlign: 'left',
    color: colors.icono,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
    textAlign: 'center'
  },
  buttonTextLogin: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 20,
  },
  loginButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.icono,
    height: 48,
    borderRadius: 4,
    paddingHorizontal: 20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20
  },
  separador: {
    width: 0.3,
    height: 25,
    backgroundColor: '#fff'
  },
  errorText: {
    color: colors.icono,
  },
  errorTextNoVisible: {
    opacity: 0
  },
});

export default LogIn;