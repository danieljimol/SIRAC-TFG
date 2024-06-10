import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, ScrollView, Dimensions
} from 'react-native';
import axios from '../api/axiosConfig';
import colors from '../styles/Colors';

const { width, height } = Dimensions.get('window');
const diasDeLaSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const ScheduleComponent = ({ endpoint, customStyles, scrollViewRef }) => {
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const horizontalScrollViewRef = useRef();

  useEffect(() => {
    const obtenerHorarios = async () => {
      try {
        const resultado = await axios.get('/horarios/');
        setHorarios(resultado.data);
      } catch (error) {
        console.error('Error al obtener los horarios:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerHorarios();
  }, [endpoint]);

  useEffect(() => {
    if (!cargando) {
      const hoy = new Date().getDay();
      const mapeoDias = [6, 0, 1, 2, 3, 4, 5];
      const indiceDiaActual = mapeoDias[hoy];
      horizontalScrollViewRef.current?.scrollTo({
        x: width * indiceDiaActual,
        y: 0,
        animated: false,
      });
    }
  }, [cargando]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const currentPage = Math.round(scrollPosition / width);
    setPageIndex(currentPage);

    if (scrollPosition !== 0 && scrollViewRef.current) {
      scrollViewRef.current.setNativeProps({ scrollEnabled: false });
    } else if (scrollViewRef.current) {
      scrollViewRef.current.setNativeProps({ scrollEnabled: true });
    }
  };

  const handleMomentumScrollEnd = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.setNativeProps({ scrollEnabled: true });
    }
  };

  const filtrarHorariosPorDia = (dia) => {
    return horarios.filter(horario => horario.diaDeLaSemana === diasDeLaSemana[dia]);
  };

  const renderPageIndicators = () => {
    return diasDeLaSemana.map((dia, index) => (
      <View key={index} style={[styles.pageIndicator, { opacity: pageIndex === index ? 1 : 0.5 }]} />
    ));
  };

  return (
    <SafeAreaView>
      {cargando ? (
        <View style={styles.loadingContainer}></View>
      ) : (
        <View style={styles.container}>
          <ScrollView
            ref={horizontalScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEventThrottle={16}
          >
            {diasDeLaSemana.map((dia, index) => (
              <ScrollView
                key={`dia-${index}`}
                contentContainerStyle={styles.dayContainer}
                style={{ width: width, height: height }}
              >
                <View style={{ flex: 1, alignSelf: 'stretch', paddingHorizontal: 0 }}>
                  <Text style={styles.title}>{dia.charAt(0).toUpperCase() + dia.slice(1)}</Text>
                </View>
                {filtrarHorariosPorDia(index).map((horario) => (
                  <View key={`horario-${horario.id}`} style={styles.horarioItem}>
                    <Text style={styles.asignaturaNombre}>
                      {horario.Asignatura?.nombre.length > 25 ? horario.Asignatura?.nombre.substring(0, 25) + '...' : horario.Asignatura?.nombre}
                    </Text>
                    <View style={styles.horaInicioFinContainer}>
                      <Text style={styles.asignaturaHora}>{horario.horaInicio.substr(0, 5)}</Text>
                      <Text style={styles.asignaturaHora}>-</Text>
                      <Text style={styles.asignaturaHora}>{horario.horaFin.substr(0, 5)}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ))}
          </ScrollView>
          <View style={styles.pageIndicatorContainer}>
            {renderPageIndicators()}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    position: 'relative'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayContainer: {
    display:'flex',
    flexDirection: 'column',
    // alignItems: 'center',
    // justifyContent: 'center'
    paddingHorizontal: 10
  },
  title: {
    color: colors.text, 
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'left',
  },
  horarioItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 8,
    padding: 20,
    borderRadius: 10,
    backgroundColor: colors.boton
  },
  asignaturaNombre: {
    color: '#fff',
    fontSize: 18
  },
  horaInicioFinContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
  },
  asignaturaHora: {
    color: '#cccccc',
    fontSize: 16
  },
  pageIndicatorContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    // backgroundColor: colors.boton,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    position: 'absolute',
    bottom: 250
  },
  pageIndicator: {
    height: 6,
    width: 6,
    borderRadius: 5,
    backgroundColor: '#fff',
  }
});

export default ScheduleComponent;
