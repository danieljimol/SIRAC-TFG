import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  Alert,
  Modal,
  Image,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
  NativeModules,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  NativeEventEmitter,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import DeviceList from '../components/DeviceList';
import axios from '../api/axiosConfig';
import colors from '../styles/Colors';
import { useAuth } from '../../AuthContext';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modalize } from 'react-native-modalize';
import { TextInput } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import CustomPicker from '../components/CustomPicker';

const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const DetectorApp = ({ navigation }) => {
  const modalizeRef = useRef(null);

  const peripherals = new Map();
  const procesandoUUIDs = new Set();

  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [alumnosRegistrados, setAlumnosRegistrados] = useState([]);
  const [alumnosNoRegistrados, setAlumnosNoRegistrados] = useState([]);
  const [asignaturaActual, setAsignaturaActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [faltasAlumnos, setFaltasAlumnos] = useState([]);
  const [alumnosConFaltas, setAlumnosConFaltas] = useState([]);
  const [faltas, setFaltas] = useState([]);
  const [modalExpanded, setModalExpanded] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [todasAsignaturas, setTodasAsignaturas] = useState([]);
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState(null);
  const [alumnosConFaltasOriginal, setAlumnosConFaltasOriginal] = useState([]);

  // CurrentUserinfo
  const [userToken, setUserToken] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [userPicture, setUserPicture] = useState(null);
  const { signOut } = useAuth();

  const [perfilVisible, setPerfilVisible] = useState(false);
  const [faltasVisibles, setFaltasVisibles] = useState(false);
  const [alumnoSeleccionadoId, setAlumnoSeleccionadoId] = useState(null);

  async function requestBluetoothPermissions() {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, // Asegúrate de solicitar también este permiso para conexiones.
      ]);

      if (granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED) {
      } else {
        console.log('Bluetooth permission denied');
      }
    } catch (err) {
      // console.log('Error al comprobar los permisos', err);
    }
  }

  const obtenerTodasLasAsignaturas = async () => {
    try {
      const response = await axios.get('asignaturas/getAllProfesor');
      const { data } = response;
      setTodasAsignaturas(data);
      if (data.length > 0) {
        setAsignaturaSeleccionada(data[0]);
      }
    } catch (error) {
      // console.log('Error al obtener las asignaturas', error);
    }
  }

  const obtenerTodosLosAlumnos = async () => {
    if (!asignaturaSeleccionada) return;
    try {
      const response = await axios.get(`alumnos/obtenerTodosLosAlumnos/${asignaturaSeleccionada.id}`);
      const { data } = response;
      setAlumnos(data);
    } catch (error) {
      setAlumnos([]);
      console.log('Error al obtener los alumnos', error.code);
    }
  }

  const obtenerTodosLosAlumnosRegistrados = async () => {
    try {
      const response = await axios.get('/alumnos/obtenerTodosLosRegistrados/');
      const { data } = response;
      setAlumnosRegistrados(data);
    } catch (error) {
      // console.log('Error al obtener los alumnos registrados', error);
    }
  }

  const obtenerTodosLosAlumnosNoRegistrados = async () => {
    try {
      const response = await axios.get('/alumnos/obtenerTodosLosNoRegistrados/');
      const { data } = response;
      console.log('Alumnos no registrados', data);
      setAlumnosNoRegistrados(data);
    } catch (error) {
      console.log('Error al obtener los alumnos no registrados', error);
    }
  }

  const obtenerTodasLasFaltas = async () => {
    if (!asignaturaSeleccionada) return;
    try {
      const response = await axios.get(`/asistencia/faltas/${asignaturaSeleccionada.id}`);
      const { data } = response;
      console.log('Faltas recibidas:', data); // Agrega este log para verificar la estructura de los datos
      setFaltasAlumnos(data);
    } catch (error) {
      console.log('Error al obtener las faltas', error);
    }
  };

  const obtenerFaltas = async (alumnoFaltasId) => {
    try {
      if (alumnoSeleccionadoId === alumnoFaltasId) {
        setFaltasVisibles(prev => !prev);
      } else {
        setLoading(true);
        setFaltas([]);
        const response = await axios.get(`/asistencia/faltas/${alumnoFaltasId}/${asignaturaSeleccionada.id}`);
        const { data } = response;
        setFaltas(data);
        setFaltasVisibles(true);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      console.log('Error durante la llamada Axios', error);
    }
  }

  const obtenerAsignaturaActual = async () => {
    try {
      const response = await axios.get(`/horarios/asignaturaActual/profesor`);
      const { data } = response;
      setAsignaturaActual(data);
    } catch (error) {
      // console.log('Error al obtener la asignatura actual', error);
    }
  }

  const filtrarAlumnos = (texto) => {
    setTextoBusqueda(texto);
    if (!texto.trim()) {
      setAlumnosConFaltas(alumnosConFaltasOriginal); 
    } else {
      const filtrados = alumnosConFaltasOriginal.filter(({ nombreCompleto }) =>
        nombreCompleto.toLowerCase().includes(texto.toLowerCase())
      );
      setAlumnosConFaltas(filtrados);
    }
  };  

  useEffect(() => {
    if (Platform.OS === 'android' && Platform.Version >= 31) { // API nivel 31 corresponde a Android 12
      requestBluetoothPermissions();
    }
  
    const getCurrentUserInfo = async () => {
      setUserToken(await AsyncStorage.getItem('userToken'));
      setUserName(await AsyncStorage.getItem('userName'));
      setUserEmail(await AsyncStorage.getItem('userEmail'));
      setUserPicture(await AsyncStorage.getItem('userPicture'));
    };

    getCurrentUserInfo();
    
    obtenerTodosLosAlumnosRegistrados(),
    obtenerTodosLosAlumnosNoRegistrados(),
    obtenerTodasLasAsignaturas();  
  }, []);
  
  useEffect(() => {
    if (asignaturaSeleccionada) {
      setLoading(true);
      Promise.all([
        obtenerTodosLosAlumnos(),
        obtenerAsignaturaActual(),
        obtenerTodasLasFaltas()
      ]).then(() => {
        setLoading(false);
      });
    }
  }, [asignaturaSeleccionada]);
  

  useFocusEffect(
    React.useCallback(() => {
      obtenerTodasLasAsignaturas();
    }, [])
  );

  const verificarRegistroAlumno = async (alumno, asignaturaId, fecha) => {
    try {
      const response = await axios.get(`/asistencia/asistenciaAsignaturaAlumno/${alumno.id}/${asignaturaActual}`);

      // Si el código de estado es 200, el alumno ya tiene un registroj
      if (response.status === 200) {
        console.log("El alumno ya tiene un registro de asistencia.");
      }
    } catch (error) {
      // El error 404 indica que no se encontró el registro, entonces procedemos a crear uno
      if (error.response && error.response.status === 404) {
        console.log("El alumno no tiene un registro de asistencia. Creando uno nuevo...");

        try {
          await axios.post('/asistencia/', {
            alumnoId: alumno.id,
            asignaturaId: asignaturaId,
            fecha: fecha
          });

          setAlumnosRegistrados(prev => [...prev, alumno]);
        } catch (postError) {
          console.log(`Error al registrar la asistencia: ${postError}`);
        }
      } else {
        console.log(`Error al verificar el registro de asistencia: ${error}`);
      }
    }
  };

  useEffect(() => {
    if (!loading) {
      BleManager.enableBluetooth().then(() => {
        console.log('Bluetooth is turned on!');
      });

      BleManager.start({ showAlert: false }).then(() => {
        console.log('BleManager initialized');
      });

      let stopDiscoverListener = BleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        async peripheral => {
          // Comprobación si el dispositivo tiene serviceUUIDs y si alumnos ha sido cargado
          if (peripheral.advertising.serviceUUIDs && peripheral.advertising.serviceUUIDs.length > 0 && alumnosNoRegistrados) {
            const discoveredDeviceUUID = peripheral.advertising.serviceUUIDs[0].toUpperCase();

            if (!procesandoUUIDs.has(discoveredDeviceUUID)) {
              procesandoUUIDs.add(discoveredDeviceUUID);

              console.log('Discovered device:', peripheral.advertising.serviceUUIDs[0]);

              // Encuentra el alumno basado en el UUID del dispositivo
              const alumno = alumnosNoRegistrados.find(alumnoNoRegistrado => alumnoNoRegistrado.uuidBLE.toUpperCase() === discoveredDeviceUUID);

              if (alumno) {
                const asignaturaId = asignaturaActual.asignaturaId;
                const fecha = new Date();

                await verificarRegistroAlumno(alumno, asignaturaId, fecha);

                peripheral.alumnoData = {
                  nombreCompleto: alumno.nombreCompleto,
                  correo: alumno.correo
                };

                peripherals.set(peripheral.id, peripheral);
                setDiscoveredDevices(Array.from(peripherals.values()));
              }
            }
          }
        },
      );

      let stopScanListener = BleManagerEmitter.addListener(
        'BleManagerStopScan',
        () => {
          setIsScanning(false);
          console.log('scan stopped');
        },
      );

      if (Platform.OS === 'android' && Platform.Version >= 23) {
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ).then(result => {
          if (result) {
            console.log('Permission is OK');
          } else {
            PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ).then(result => {
              if (result) {
                console.log('User accepted');
              } else {
                console.log('User refused');
              }
            });
          }
        });
      }

      return () => {
        stopDiscoverListener.remove();
        stopScanListener.remove();
      };
    }
  }, [loading]);

  const startScan = () => {
    if (!isScanning) {
      BleManager.scan([], 10*60, true)
        .then(() => {
          console.log('Scanning...');
          setIsScanning(true);
        })
        .catch(error => {
          console.log('Error al iniciar el scaneo', error);
        });
    }
  };

  const stopScan = () => {
    if (isScanning) {
      BleManager.stopScan()
        .then(() => {
          console.log('Scanning stopped');
          setIsScanning(false);
        })
        .catch(error => {
          console.log('Error al detener el escaneo', error);
        });
    }
  };  

  const googleSignOut = async () => {
    try {
      await GoogleSignin.signOut();
      AsyncStorage.setItem('userLogged', 'false');
      AsyncStorage.setItem('elegirCargo', '');
      signOut();
    } catch (error) {
      console.log('Error al cerrar sesión', error);
    }
  };

  // Combina la lista de alumnos con la lista de faltas, asignando un 0 a los que no tengan faltas.
  useEffect(() => {
    const actualizarAlumnosConFaltas = () => {
      const alumnosConFaltas = alumnos.map(alumno => {
        const falta = faltasAlumnos.find(falta => falta.id === alumno.id);
        return {
          ...alumno,
          totalFaltas: falta ? falta.totalFaltas : 0
        };
      });
      setAlumnosConFaltas(alumnosConFaltas);
      setAlumnosConFaltasOriginal(alumnosConFaltas); 
    };
  
    actualizarAlumnosConFaltas();
  }, [alumnos, faltasAlumnos]); 

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="ligth-content" hidden={false} />
      <Text style={styles.nombreAsignatura}>{asignaturaActual ? asignaturaActual.Asignatura.nombre : 'No hay clases'}</Text>
      <View>
        <TouchableOpacity
          activeOpacity={0.5}
          style={styles.scanButton}
          onPress={isScanning ? stopScan : startScan}>
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Detener búsqueda' : 'Buscar alumnos'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.subtitle}>Alumnos apuntados</Text>
        {alumnosRegistrados.length > 0 ? (
          <FlatList
            data={alumnosRegistrados}
            renderItem={({ item }) => (
              <DeviceList
                alumno={item}
              />
            )}
            keyExtractor={item => item.id}
          />
        ) : (
          <Text style={styles.noDevicesText}>Todavía no hay alumnos apuntados</Text>
        )}
      </View>
      <Modalize
        avoidKeyboardLikeIOS={true}
        ref={modalizeRef}
        alwaysOpen={!asignaturaActual ? Dimensions.get('window').height : 80}
        modalHeight={Dimensions.get('window').height}
        onPositionChange={() => setModalExpanded(prevState => !prevState)}
        handlePosition="inside"
        handleStyle={!asignaturaActual ? { opacity: 0 } : { opacity: 1, backgroundColor: colors.text }}
        modalStyle={{
          marginTop: 0,
          paddingTop: 0,
          marginBottom: 0,
          paddingBottom: 0,
          backgroundColor: colors.backgroundSecondary,
        }}
        panGestureEnabled={!asignaturaActual ? false : true}
        closeOnOverlayTap={!asignaturaActual ? false : true}
      >
        <View style={styles.segundaPantallaContainer}>

          <View style={styles.cabeceraSegundaPantallaContainer}>
            <View style={styles.nombreAsignaturaFotoPerfilContainer}>
              {modalExpanded ? (<>
                <View style={styles.alumnosNombreAsignaturaContainer}>
                  <Text style={styles.tuPerfilText}>Alumnos</Text>
                  {todasAsignaturas.length > 0 ? (
                    <CustomPicker
                      selectedValue={asignaturaSeleccionada?.nombre}
                      onValueChange={(item) => setAsignaturaSeleccionada(item)}
                      options={todasAsignaturas}
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.añadirAsignatura}
                      onPress={() => {
                        navigation.navigate('CrearAsignaturaScreen');
                      }}
                    >
                      <Text style={styles.añadirAsignaturaText}>Añadir asignatura</Text>
                      {/* <Octicons name="plus" size={22} color={colors.icono} /> */}
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity onPress={() => setPerfilVisible(prev => !perfilVisible)}>
                  {userPicture ? (
                    <Image source={{ uri: userPicture }} style={styles.userPhotoPequena} />
                  ) : <></>}
                </TouchableOpacity></>
              ) : (
                <Text style={styles.tuPerfilTextCenter}>Alumnos</Text>
              )
              }
            </View>
            {
              userPicture && perfilVisible ?
                <View style={styles.infoUserContainerButton}>
                  <View style={styles.pictureNameEmailContainer}>
                    <Image source={{ uri: userPicture }} style={styles.userPhoto} />
                    <View>
                      <Text style={styles.userName}>{userName}</Text>
                      <Text style={styles.userEmail}>
                        {userEmail.length > 25 ? userEmail.substring(0, 25) + '...' : userEmail}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={googleSignOut} style={styles.signOutButton}>
                    <Octicons name="sign-out" size={22} color={colors.icono} />
                  </TouchableOpacity>
                </View>
                :
                <></>
            }
            <View style={styles.cuadroBusqueda}>
              <TextInput
                style={styles.buscador}
                placeholder='Buscar...'
                placeholderTextColor={'#e4e6e7'}
                value={textoBusqueda}
                onChangeText={filtrarAlumnos}
              />
              <TouchableOpacity
                onPress={() => filtrarAlumnos("")}
                style={styles.borrar}
              >
                <Octicons name="x" size={16} color={colors.icono} />
              </TouchableOpacity>
            </View>
            {alumnosConFaltas.map((alumno) => (
              <View key={alumno.id}>
                <TouchableOpacity
                  onPress={() => {
                    setAlumnoSeleccionadoId(alumno.id);
                    obtenerFaltas(alumno.id);
                  }}
                >
                  <View style={styles.alumnosContainer}>
                    <Text style={styles.nombreAlumno}>{alumno.nombreCompleto}</Text>
                    <Text style={styles.faltasAlumno}>{alumno.totalFaltas}</Text>
                  </View>
                </TouchableOpacity>
                {alumnoSeleccionadoId === alumno.id && faltasVisibles && (
                  loading ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : (
                    <View>
                      {faltas.map((faltaDetalle) => (
                        <View key={faltaDetalle.id} style={styles.faltaContainer}>
                          <Text style={styles.fechaFalta}>
                            {new Date(faltaDetalle.fecha).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </Text>
                          <Text style={styles.nombreFalta}>
                            {faltaDetalle.Asignatura.nombre.length > 30 ? faltaDetalle.Asignatura.nombre.substring(0, 30) + '...' : faltaDetalle.Asignatura.nombre}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )
                )}
              </View>
            ))}
          </View>
        </View>
      </Modalize>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    paddingHorizontal: 10,
    paddingVertical: 30,
    backgroundColor: colors.background
  },
  scrollContainer: {
    padding: 16,
  },
  title: {
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 24,
    marginBottom: 10,
    marginTop: 20,
    color: colors.text
  },
  scanButton: {
    backgroundColor: colors.botonGordo,
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  scanButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18
  },
  noDevicesText: {
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
    color: colors.text
  },
  deviceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  deviceItem: {
    marginBottom: 10,
  },
  deviceName: {
    fontSize: 12,
  },
  deviceInfo: {
    fontSize: 14,
  },
  deviceButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  nombreAsignatura: {
    color: '#ffff',
    fontWeight: '900',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20
  },
  infoUserContainerButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
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
    justifyContent: 'center',
    gap: 20
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
  signOutButton: {
    // backgroundColor: '#fff',
    padding: 10
  },
  segundaPantallaContainer: {
    // position: 'relative'
  },
  cabeceraSegundaPantallaContainer: {
    display: 'flex',
    flexDirection: 'column',
    paddingHorizontal: 10,
    paddingVertical: 30,
    gap: 10
  },
  nombreAsignaturaFotoPerfilContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  alumnosNombreAsignaturaContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20
  },
  alumnosAsignaturasContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'red'
  },
  tuPerfilText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  pickerContainer: {
    width: 165,
  },
  picker: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  tuPerfilTextCenter: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 20
  },
  cuadroBusqueda: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  buscador: {
    backgroundColor: colors.boton,
    borderRadius: 6,
    paddingLeft: 10,
    color: colors.text,
    width: '100%'
  },
  borrar: {
    position: 'absolute',
    right: 10,
    padding: 10
  },
  alumnosContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 5
  },
  nombreAlumno: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600'
  },
  faltasAlumno: {
    color: colors.icono,
    fontSize: 16,
    fontWeight: '600'
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
  fechaFalta: {
    color: colors.icono,
    fontSize: 16
  },
  userPhoto: {
    width: 42,
    height: 42,
    borderRadius: 45,
  },
  userPhotoPequena: {
    width: 32,
    height: 32,
    borderRadius: 45,
  },
  añadirAsignatura: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 0.3,
    borderColor: colors.icono,
    borderRadius: 5
  },
  añadirAsignaturaText: {
    fontSize: 18,
    color: colors.icono
  },
});

export default DetectorApp;
