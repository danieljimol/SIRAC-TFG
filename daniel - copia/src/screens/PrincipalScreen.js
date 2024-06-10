import React, { useRef, useEffect, useState, useReducer } from 'react';
import {
  StyleSheet, View, Text, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Image, Platform, Animated, Modal,
} from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
// import axios from 'axios';
import axios from '../api/axiosConfig';
import { NativeModules } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { StatusBar } from 'react-native';
import { Modalize } from 'react-native-modalize';
import ScheduleComponent from '../components/ScheduleComponent';
import { MotiView } from 'moti'
import { Easing } from 'react-native-reanimated';
import { Octicons } from '@expo/vector-icons';
import { useAuth } from '../../AuthContext';
import colors from '../styles/Colors';
import { TextInput } from 'react-native-gesture-handler';

const socket = io("http://172.20.10.2:3000");

const windowHeight = Dimensions.get('window').height;

const { BleModule } = NativeModules;

const Principal = () => {
  const [asignaturaActual, setAsignaturaActual] = useState(null);
  const [asignaturaProxima, setAsignaturaProxima] = useState(null);
  const [uuidBle, setUUIDBLE] = useState("");
  const [estaRegistradaAsistencia, setEstaRegistradaAsistencia] = useState(false);
  const modalizeRef = useRef(null);
  const [modalExpanded, setModalExpanded] = useState(false);
  const [codigoClase, setCodigoClase] = useState("");
  const [codigoClaseIncorrecto, setCodigoClaseIncorrecto] = useState(false);
  const [todasAsignaturas, setTodasAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef(null);

  // Faltas
  const [faltasVisibles, setFaltasVisibles] = useState(false);
  const [faltas, setFaltas] = useState([]);

  // Clases
  const [clasesVisibles, setClasesVisibles] = useState(false);

  // CurrentUserinfo
  const [userToken, setUserToken] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [userPicture, setUserPicture] = useState(null);
  const { signOut } = useAuth();

  // Animaciones botón
  const [scaleAnim] = useState(new Animated.Value(1));
  const ringScaleAnim = useRef(new Animated.Value(1)).current;
  const ringOpacityAnim = useRef(new Animated.Value(0)).current;
  const [dotVisible, setDotVisible] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);

  // Bluetooth
  const [isAdvertising, setIsAdvertising] = useState(false);

  // Estado del modal de confirmación
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedAsignatura, setSelectedAsignatura] = useState(null);

  // Animación
  const startAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.06,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    const initializeApp = async () => {
      obtenerAsignaturaActual();
      obtenerAsignaturaProxima();
      requestPermissions();
      obtenerUUIDBLE();
      obtenerAsistenciaAsignaturaActual();
      obtenerFaltas();
      obtenerTodasLasAsignaturas();

      const getCurrentUserInfo = async () => {
        setUserToken(await AsyncStorage.getItem('userToken'));
        setUserName(await AsyncStorage.getItem('userName'));
        setUserEmail(await AsyncStorage.getItem('userEmail'));
        setUserPicture(await AsyncStorage.getItem('userPicture'));
      };

      await getCurrentUserInfo();
    };

    initializeApp();

    socket.on('asistenciaRegistrada', async (data) => {
      console.log('Esta es la data que recibo de asistenciaRegistrada :', data);
      const alumnoId = await AsyncStorage.getItem('alumnoId');
      if (data.alumnoId == alumnoId) {
        setEstaRegistradaAsistencia(true);
      }
    });

    const verificarCambioDeAsignatura = setInterval(() => {
      obtenerAsignaturaActual();
    }, 10000);

    startAnimation();

    return () => {
      clearInterval(verificarCambioDeAsignatura);
      socket.off('asistenciaRegistrada');
    };
  }, []);

  useEffect(() => {
    if (asignaturaActual) {
      startAnimation();
    }
  }, [asignaturaActual]);

  const obtenerUUIDBLE = async () => {
    try {
      const correoLogeado = await AsyncStorage.getItem('userEmail');
      const response = await axios.get(`/alumnos/email/${correoLogeado}`);
      const { data } = response;
      setUUIDBLE(data.uuidBLE);
    } catch (error) {
      console.log('Error durante la llamada Axios', error);
    }
  }

  const obtenerTodasLasAsignaturas = async () => {
    try {
      setLoading(true);
      const response = await axios.get('asignaturas/getAllAlumno');
      const { data } = response;
      setTodasAsignaturas(data);
      setLoading(false);
    } catch (error) {
      console.log('Error durante la llamada Axios', error);
    }
  }

  const unirseClase = async () => {
    try {
      const response = await axios.post(`/alumnos/unirseClase`, { codigoClase: codigoClase });
      obtenerTodasLasAsignaturas();
      setCodigoClase("");
      setCodigoClaseIncorrecto(false);
    } catch (error) {
      setCodigoClaseIncorrecto(true);
      console.log(`Error al unirse a la clase ${error}`)
    }
  }

  const salirseClaseConfirm = async () => {
    try {
      const response = await axios.get(`/alumnos/salirseClase/${selectedAsignatura.id}`);
      await obtenerTodasLasAsignaturas();
      setConfirmModalVisible(false);
    } catch (error) {
      setConfirmModalVisible(false);
      console.log(error);
    }
  };

  const obtenerFaltas = async () => {
    try {
      const alumnoId = await AsyncStorage.getItem('alumnoId');
      const response = await axios.get(`/asistencia/faltas/alumno/todas/faltas`);
      const { data } = response;
      setFaltas(data);
      setIsInitialized(true);
      startAnimation();
    } catch (error) {
      console.log('Error durante la obtención de las faltas', error);
    }
  }

  const obtenerAsignaturaActual = async () => {
    try {
      const response = await axios.get('/horarios/asignaturaActual/alumno');
      const { data } = response;
      if (asignaturaActual && asignaturaActual.id !== data.id) {
        setEstaRegistradaAsistencia(false);
      }
      await AsyncStorage.setItem('asignaturaId', data.asignaturaId.toString());
      setAsignaturaActual(data);
    } catch (error) {
      if (error.code == 'ERR_BAD_REQUEST') {
        setEstaRegistradaAsistencia(false);
        console.log('Error durante la llamada Axios', error);
      } else {
        console.log('Error durante la llamada Axios', error);
      }
    }
  }

  const obtenerAsignaturaProxima = async () => {
    try {
      const response = await axios.get('/horarios/asignaturaProxima');
      const { data } = response;
      await AsyncStorage.setItem('asignaturaProximaId', data.asignaturaId.toString());
      setAsignaturaProxima(data);
    } catch (error) {
      console.log('Error durante la llamada Axios', error);
      console.log(error);
    }
  }

  const obtenerAsistenciaAsignaturaActual = async () => {
    try {
      const alumnoId = await AsyncStorage.getItem('alumnoId');
      const asignaturaId = await AsyncStorage.getItem('asignaturaId');
      const response = await axios.get(`/asistencia/asistenciaAsignaturaAlumno/${alumnoId}/${asignaturaId}`);
      const { data } = response;
      if (response.status == 200) {
        setEstaRegistradaAsistencia(true);
      }
    } catch (error) {
      console.log('Error durante la llamada Axios', error);
      setEstaRegistradaAsistencia(false);
      console.log('Todavía no se ha registrado la asistencia ' + error);
    }
  }

  const requestPermissions = async () => {
    const bluetoothPermission = Platform.OS === 'ios' ? PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    const bluetoothAdvertisePermission = Platform.OS === 'ios' ? PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL : PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE;
    const locationPermission = Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

    const bluetoothStatus = await request(bluetoothPermission);
    const bluetoothAdvertiseStatus = await request(bluetoothAdvertisePermission);
    const locationStatus = await request(locationPermission);

    if (bluetoothStatus === RESULTS.GRANTED && locationStatus === RESULTS.GRANTED && bluetoothAdvertisePermission === RESULTS.GRANTED) {
      console.log('Bluetooth and Location permissions granted');
    } else {
      console.log('Permissions not granted');
    }
  };

  const startAdvertising = async () => {
    if (isAdvertising) {
      console.log("Ya se está anunciando. Deteniendo anuncio actual antes de iniciar uno nuevo.");
      await stopAdvertising();
    }

    BleModule.startAdvertising(uuidBle);
    setDotVisible(prev => true);
    setIsAdvertising(true);
    await sleep(5000);
    await stopAdvertising();
    setDotVisible(prev => false);
  };

  const stopAdvertising = async () => {
    BleModule.stopAdvertising();
    setIsAdvertising(false);
  };

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const googleSignOut = async () => {
    try {
      await GoogleSignin.signOut();
      AsyncStorage.setItem('userLogged', 'false');
      AsyncStorage.setItem('elegirCargo', '');
      signOut();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="ligth-content" hidden={false} />
      {asignaturaActual && !estaRegistradaAsistencia ?
        <View style={styles.principalContainer}>
          <Text style={styles.nombreAsignatura}>{asignaturaActual?.Asignatura?.nombre || 'Sin asignatura'}</Text>
          <View style={styles.alinearBotonAros}>
            <Animated.View style={[styles.botonApuntarse, { transform: [{ scale: scaleAnim }] }]}>
              <TouchableOpacity
                onPress={startAdvertising}
                style={styles.botonApuntarse}
              >
                <Text style={styles.letraBotonApuntarse}>S</Text>
              </TouchableOpacity>
            </Animated.View>
            {
              dotVisible ?
                <View style={[styles.dot, styles.center]}>
                  {[...Array(3).keys()].map(index => {
                    return (
                      <MotiView
                        from={{ opacity: 0.7, scale: 1 }}
                        animate={{ opacity: 0, scale: 4, useNativeDriver: true }}
                        transition={{
                          type: 'timing',
                          duration: 2000,
                          easing: Easing.out(Easing.ease),
                          delay: index * 400,
                          repeatReverse: false,
                          loop: true
                        }}
                        key={index}
                        style={[StyleSheet.absoluteFillObject, styles.dot]}
                      />
                    );
                  })}
                </View> :
                <></>
            }
          </View>
        </View> :
        <View style={styles.principalContainer}>
          {
            !estaRegistradaAsistencia ?
              <Text style={styles.nombreAsignatura}>Disfruta...</Text> :
              <View>
                <Text style={styles.nombreAsignaturaAsistenciRegistrada}>{asignaturaActual?.Asignatura?.nombre || 'Sin asignatura'}</Text>
              </View>
          }
          <Animated.View style={[styles.botonApuntarse, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.letraBotonApuntarse}>S</Text>
          </Animated.View>
        </View>
      }
      <Modalize
        avoidKeyboardLikeIOS={true}
        ref={modalizeRef}
        alwaysOpen={130}
        modalHeight={780}
        handlePosition="inside"
        handleStyle={{
          backgroundColor: colors.text
        }}
        onPositionChange={() => setModalExpanded(prevState => !prevState)}
        modalStyle={{
          marginTop: 0,
          paddingTop: 0,
          marginBottom: 0,
          paddingBottom: 0,
          backgroundColor: colors.backgroundSecondary
        }}
      >
        {
          modalExpanded ?
            <View style={styles.segundaPantalla}>
              <Text style={styles.tuPerfilText}>Próxima clase</Text>
              {
                asignaturaProxima ?
                  <View style={styles.proximaAsignaturaContainer}>
                    <Text style={styles.proximaClaseNombre}>{asignaturaProxima?.Asignatura?.nombre || 'Sin asignatura'}</Text>
                  </View> : <></>
              }
            </View> :
            <View style={styles.segundaPantallaContainer}>
              <ScrollView ref={scrollViewRef} style={{ flex: 1 }}>
                <View style={styles.cabeceraSegundaPantallaContainer}>
                  <Text style={styles.tuPerfilText}>Mi perfil</Text>
                  {userPicture ?
                    <View style={styles.infoUserContainerButton}>
                      <View style={styles.pictureNameEmailContainer}>
                        <View style={styles.photoInfoContainer}>
                          <Image source={{ uri: userPicture }} style={styles.userPhoto} />
                          <View>
                            <Text style={styles.userName}>{userName}</Text>
                            <Text style={styles.userEmail}>
                              {userEmail.length > 32 ? userEmail.substring(0, 32) + '...' : userEmail}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={googleSignOut} style={styles.signOutButton}>
                          <Octicons name="sign-out" size={22} color={colors.icono} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    :
                    <></>}
                  <TouchableOpacity
                    style={styles.botonFaltasContainer}
                    onPress={() => setClasesVisibles(!clasesVisibles)}
                  >
                    <View style={styles.botonFaltasCabeceraContainer}>
                      <View style={styles.numeroFaltasFlechaContainer}>
                        <Octicons name="book" size={22} color={colors.icono} />
                        <Text style={styles.faltasText}>Clases</Text>
                      </View>
                      <View style={styles.numeroFaltasFlechaContainer}>
                        <Text style={styles.faltasTextNumber}>{todasAsignaturas.length}</Text>
                        <Octicons name={clasesVisibles ? "chevron-up" : "chevron-down"} size={24} color={colors.icono} />
                      </View>
                    </View>
                    {
                      clasesVisibles ?
                        <ScrollView scrollEnabled={false}>
                          {!loading ? (
                            todasAsignaturas.length > 0 && todasAsignaturas.map(asignatura => (
                              <View style={styles.asignaturasBotonContainer} key={asignatura.id}>
                                <Text style={styles.nombreFalta}>{asignatura.nombre}</Text>
                                <TouchableOpacity
                                  onPress={() => {
                                    setSelectedAsignatura(asignatura);
                                    setConfirmModalVisible(true);
                                  }}
                                  style={styles.eliminarButton}
                                >
                                  <Octicons name="dash" size={22} color={colors.icono} />
                                </TouchableOpacity>
                              </View>
                            ))
                          ) : (<ActivityIndicator size="large" color="#fff" />)}
                          <View style={styles.introducirAsignaturaContainer}>
                            <TextInput
                              style={[styles.input, { textTransform: 'uppercase' }]}
                              value={codigoClase}
                              maxLength={6}
                              onChangeText={setCodigoClase}
                              placeholder="Introduce el codigo de la asignatura"
                              placeholderTextColor={colors.icono}
                              autoCapitalize="characters"
                            />
                            {codigoClase && (
                              <TouchableOpacity
                                style={styles.añadirAsignatura}
                                onPress={() => unirseClase()}
                              >
                                <Octicons name="plus" size={22} color={colors.icono} />
                              </TouchableOpacity>)}
                          </View>
                          {codigoClaseIncorrecto && (<Text style={styles.errorText}>Código incorrecto</Text>)}
                        </ScrollView>
                        : null
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.botonFaltasContainer}
                    onPress={() => setFaltasVisibles(!faltasVisibles)}
                  >
                    <View style={styles.botonFaltasCabeceraContainer}>
                      <View style={styles.numeroFaltasFlechaContainer}>
                        <Octicons name="bell" size={22} color={colors.icono} />
                        <Text style={styles.faltasText}>Faltas</Text>
                      </View>
                      <View style={styles.numeroFaltasFlechaContainer}>
                        <Text style={styles.faltasTextNumber}>{faltas.length}</Text>
                        <Octicons name={faltasVisibles ? "chevron-up" : "chevron-down"} size={24} color={colors.icono} />
                      </View>
                    </View>
                    {
                      faltasVisibles ?
                        <ScrollView scrollEnabled={false}>
                          {faltas.map((falta) => (
                            <View key={falta.id} style={styles.faltaContainer}>
                              <Text style={styles.fechaFalta}>
                                {new Date(falta.fecha).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                })}
                              </Text>
                              <Text style={styles.nombreFalta}>
                                {falta.Asignatura.nombre.length > 30 ? falta.Asignatura.nombre.substring(0, 30) + '...' : falta.Asignatura.nombre}
                              </Text>
                            </View>
                          ))}
                        </ScrollView>
                        : null
                    }
                  </TouchableOpacity>
                </View>
                <ScheduleComponent scrollViewRef={scrollViewRef} />
              </ScrollView>
            </View>
        }
      </Modalize>
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmación</Text>
            <Text style={styles.modalMessage}>{`¿Está seguro que desea salir de la clase ${selectedAsignatura?.nombre || 'Sin asignatura'}?`}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={salirseClaseConfirm}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 100,
    height: 100,
    borderRadius: 100,
    backgroundColor: '#fff',
    position: 'absolute'
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  principalContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 200,
    gap: 40,
  },
  userPhoto: {
    width: 42,
    height: 42,
    borderRadius: 45,
  },
  nombreAsignatura: {
    color: '#ffff',
    fontWeight: '900',
    fontSize: 24,
    textAlign: 'center',
    zIndex: 3
  },
  nombreAsignaturaAsistenciRegistrada: {
    color: '#8ec696',
    fontWeight: '900',
    fontSize: 24,
    textAlign: 'center',
    zIndex: 3
  },
  botonApuntarse: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.botonGordo,
    width: 170,
    height: 170,
    borderRadius: 85,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
    position: 'relative',
    zIndex: 12
  },
  letraBotonApuntarse: {
    color: '#ffff',
    fontWeight: '900',
    fontSize: 110,
    marginBottom: 5
  },
  segundaPantalla: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 20,
    padding: 30,
  },
  infoUserContainerButton: {
    backgroundColor: colors.boton,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 20,
    borderRadius: 10,
    overflow: 'hidden'
  },
  pictureNameEmailContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoInfoContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15
  },
  introducirAsignaturaContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  añadirAsignatura: {
    position: 'absolute',
    right: 0,
    padding: 20
  },
  asignaturasBotonContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: '',
    justifyContent: 'space-between',
    gap: 20,
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 5,
    paddingBottom: 10
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  userEmail: {
    color: '#cccccc',
    fontSize: 14,
  },
  eliminarButton: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  signOutButton: {
    padding: 10
  },
  segundaPantallaContainer: {
    // height: windowHeight
  },
  cabeceraSegundaPantallaContainer: {
    display: 'flex',
    flexDirection: 'column',
    paddingHorizontal: 10,
    paddingVertical: 30,
    gap: 10
  },
  botonFaltasCabeceraContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
    backgroundColor: colors.boton,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  botonFaltasContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 5,
    backgroundColor: colors.boton,
    borderRadius: 10,
  },
  numeroFaltasFlechaContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15
  },
  faltaContainer: {
    paddingHorizontal: 15,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 20,
    marginBottom: 5,
    paddingBottom: 10
  },
  nombreFalta: {
    color: colors.text,
    fontSize: 14
  },
  input: {
    borderWidth: 0.2,
    borderColor: 'gray',
    paddingVertical: 5,
    paddingLeft: 10,
    color: colors.text,
    width: '100%',
    borderRadius: 2
  },
  errorText: {
    color: colors.icono,
    marginLeft: 20,
    marginBottom: 10
  },
  fechaFalta: {
    color: colors.icono,
    fontSize: 16
  },
  tuPerfilText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  faltasText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '500'
  },
  faltasTextNumber: {
    color: colors.icono,
    fontSize: 17,
    fontWeight: '700'
  },
  proximaAsignaturaContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 10,

  },
  proximaClaseNombre: {
    fontSize: 16,
    color: '#fff'
  },
  alinearBotonAros: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 10,
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.text
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    color: colors.text
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  modalButtonCancel: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginRight: 5
  },
  modalButtonConfirm: {
    padding: 10,
    backgroundColor: colors.icono,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginLeft: 5
  },
  modalButtonText: {
    fontSize: 16,
    color: '#fff'
  }
});

export default Principal;
