import React, { useState } from 'react';
import { 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  StyleSheet 
} from 'react-native';
import colors from '../styles/Colors';
import { Octicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CustomPicker = ({ selectedValue, onValueChange, options }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.pickerContainer}>
        <Text style={styles.selectedValue}>{selectedValue}</Text>
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.añadirAsignatura}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('CrearAsignaturaScreen');
              }}
            >
              <Text style={styles.añadirAsignaturaText}>Añadir asignatura</Text>
              <Octicons name="plus" size={22} color={colors.icono} />
            </TouchableOpacity>
            <FlatList
              data={options}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionContainer}
                  onPress={() => {
                    onValueChange(item);
                    setModalVisible(false);
                  }}
                  onLongPress={() => {
                    setModalVisible(false);
                    navigation.navigate('CrearAsignaturaScreen', { asignatura: item });
                  }}
                >
                  <Text style={styles.optionText}>{item.nombre}</Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('CrearAsignaturaScreen', { asignaturaId: item.id });
                    }}
                  >
                    <Octicons name="pencil" size={16} color={colors.icono} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerContainer: {
    padding: 10,
    borderWidth: 0.3,
    borderColor: colors.icono,
    borderRadius: 5,
    backgroundColor: colors.background,
    width: 200,
  },
  selectedValue: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
  },
  añadirAsignatura: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 15,
    borderWidth: 0.3,
    borderColor: colors.icono,
    borderRadius: 5
  },
  optionContainer: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
    color: colors.text,
  },
  añadirAsignaturaText: {
    fontSize: 18,
    color: colors.icono
  },
  editButton: {
    padding: 5,
  }
});

export default CustomPicker;
