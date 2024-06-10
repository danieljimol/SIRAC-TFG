import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, Button, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from '../api/axiosConfig';
import colors from '../styles/Colors';
import { Octicons } from '@expo/vector-icons';

const CrearAsignaturaScreen = ({ navigation, route }) => {
  const { asignaturaId } = route.params || {};

  const [isPickerShowInicio, setIsPickerShowInicio] = useState(false);
  const [isPickerShowFin, setIsPickerShowFin] = useState(false);
  const [currentHorarioIndex, setCurrentHorarioIndex] = useState(null);

  const [nombreAsignatura, setNombreAsignatura] = useState('');
  const [codigoAsignatura, setCodigoAsignatura] = useState('');
  const [horarios, setHorarios] = useState([
    { dia: 'lunes', horaInicio: new Date(), horaFin: new Date() },
  ]);

  const actualizarHorario = (index, campo, valor) => {
    const nuevosHorarios = [...horarios];
    nuevosHorarios[index][campo] = valor;
    setHorarios(nuevosHorarios);

    if (index === horarios.length - 1) {
      agregarHorario();
    }
  };

  const agregarHorario = () => {
    setHorarios([...horarios, { dia: 'lunes', horaInicio: new Date(), horaFin: new Date() }]);
  };

  const eliminarHorario = (index) => {
    if (horarios.length > 1) {
      setHorarios(horarios.filter((_, i) => i !== index));
    }
  };

  const showPickerInicio = (index) => {
    setCurrentHorarioIndex(index);
    setIsPickerShowInicio(true);
  };

  const showPickerFin = (index) => {
    setCurrentHorarioIndex(index);
    setIsPickerShowFin(true);
  };

  const crearAsignatura = async () => {
    try {
      if (asignaturaId) {
        await axios.put(`asignaturas/${asignaturaId}`, {
          nombreAsignatura: nombreAsignatura,
          horarios: horarios
        });
      } else {
        await axios.post('asignaturas/', {
          nombreAsignatura: nombreAsignatura,
          horarios: horarios
        });
      }
      navigation.navigate('DetectorApp');
    } catch (error) {
      console.error(`Error al ${asignaturaId ? 'editar' : 'crear'} la asignatura ${error}`);
    }
  };

  const obtenerAsignatura = async () => {
    try {
      const response = await axios.get(`asignaturas/${asignaturaId}`);
      const { data } = response;
      setNombreAsignatura(data.nombre);
      setCodigoAsignatura(data.codigo);

      setHorarios(data.Horarios.map(horario => ({
        dia: horario.diaDeLaSemana,
        horaInicio: new Date(`1970-01-01T${horario.horaInicio}`),
        horaFin: new Date(`1970-01-01T${horario.horaFin}`)
      })));
    } catch (error) {
      console.error('Error al obtener la asignatura', error);
    }
  };

  const eliminarAsignatura = async () => {
    try {
      const response = await axios.delete(`asignaturas/${asignaturaId}`);
      navigation.navigate('DetectorApp', { refresh: true });
    } catch (error) {
      console.error('Error al eliminar la asignatura', error);
    }
  }

  useEffect(() => {
    if (asignaturaId) {
      obtenerAsignatura();
    }
  }, [asignaturaId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.cabeceraContainer}>
        <Text style={styles.title}>{asignaturaId ? 'Editar Asignatura' : 'Crear Asignatura'}</Text>
        {asignaturaId && (<TouchableOpacity onPress={() => eliminarAsignatura()} style={styles.eliminarButton}>
          <Octicons name="trash" size={22} color={colors.icono} />
        </TouchableOpacity>)}
      </View>
      <TextInput
        style={styles.input}
        value={nombreAsignatura}
        onChangeText={setNombreAsignatura}
        placeholder="Nombre de la asignatura"
        placeholderTextColor={colors.text}
        maxLength={100}
      />
      {asignaturaId && (
      <View style={styles.codigoContainer}>
        <Text style={styles.codigo}>{codigoAsignatura.toUpperCase()}</Text>
      </View>
      )}
      {horarios.map((horario, index) => (
        <View key={index} style={styles.row}>
          <Picker
            selectedValue={horario.dia}
            style={styles.picker}
            onValueChange={(itemValue) => actualizarHorario(index, 'dia', itemValue)}
          >
            {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map(dia => (
              <Picker.Item key={dia} label={dia} value={dia.toLowerCase()} />
            ))}
          </Picker>
          <View style={styles.timeContainer}>
            <TouchableOpacity onPress={() => showPickerInicio(index)}>
              <Text style={styles.timeText}>
                {horario.horaInicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            {isPickerShowInicio && currentHorarioIndex === index && (
              <DateTimePicker
                value={horario.horaInicio}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, selectedDate) => {
                  actualizarHorario(index, 'horaInicio', selectedDate || horario.horaInicio);
                  setIsPickerShowInicio(false);
                }}
              />
            )}
            <TouchableOpacity onPress={() => showPickerFin(index)}>
              <Text style={styles.timeText}>
                {horario.horaFin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            {isPickerShowFin && currentHorarioIndex === index && (
              <DateTimePicker
                value={horario.horaFin}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, selectedDate) => {
                  actualizarHorario(index, 'horaFin', selectedDate || horario.horaFin);
                  setIsPickerShowFin(false);
                }}
              />
            )}
            <TouchableOpacity onPress={() => eliminarHorario(index)}>
              <Octicons name="x" size={22} color={colors.icono} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={crearAsignatura}>
        <Text style={styles.addButtonText}>{asignaturaId ? 'Guardar cambios' : 'Añadir asignatura'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  cabeceraContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  input: {
    borderWidth: 0.3,
    borderColor: colors.icono,
    borderRadius: 3,
    padding: 10,
    marginBottom: 20,
    color: colors.text,
    backgroundColor: colors.backgroundSecondary
  },
  codigoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codigo: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    borderWidth: 0.3,
    borderColor: colors.icono,
    width: 100,
    paddingVertical: 10,
    margin: 10,
    marginBottom: 20,
    borderRadius: 5
  },
  picker: {
    width: 150,
    height: 50,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
  },
  timeText: {
    marginLeft: 10,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.boton,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  eliminarButton: {
    // padding: 30
  }
});

export default CrearAsignaturaScreen;
