import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import colors from '../styles/Colors';

const DeviceList = ({ alumno }) => {
  const { id, nombreCompleto, correo } = alumno;

  return (
    <View style={styles.deviceContainer}>
      <View style={styles.deviceItem}>
        {id && (
          <>
            <Text style={styles.deviceInfo}>{nombreCompleto}</Text>
            <Text style={styles.deviceInfo}>{correo}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
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
  },
  scanButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  scanButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  noDevicesText: {
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
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
    backgroundColor: colors.text
  },
  deviceInfo: {
    fontSize: 16,
    color:  colors.text,
    fontWeight: '600'
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
    zIndex: 3
  },
});

export default DeviceList;