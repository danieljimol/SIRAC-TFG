package com.daniel

import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.util.Log;
import android.os.ParcelUuid
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import androidx.work.Data
import java.util.Calendar
import androidx.work.workDataOf
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import java.util.concurrent.TimeUnit
import androidx.work.ExistingWorkPolicy

class BleModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var bluetoothManager: BluetoothManager? = null
    private var bluetoothAdvertiser: BluetoothLeAdvertiser? = null

    override fun getName(): String {
        return "BleModule"
    }

    @ReactMethod
    fun startAdvertising(id: String) {
        Log.d("BleModule", "Línea 33 Comenzamos el anuncio")

        bluetoothManager = currentActivity?.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager?
        bluetoothAdvertiser = bluetoothManager?.adapter?.bluetoothLeAdvertiser

        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_BALANCED)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(true)
            .build()

        val data = AdvertiseData.Builder()
            .addServiceUuid(ParcelUuid.fromString(id))
            .build()

        bluetoothAdvertiser?.startAdvertising(settings, data, object : AdvertiseCallback() {
            override fun onStartFailure(errorCode: Int) {
                super.onStartFailure(errorCode)
                // Manejar error
            }

            override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
                super.onStartSuccess(settingsInEffect)
                // Inicio exitoso
            }
        })
    }

    @ReactMethod
    fun stopAdvertising() {
        bluetoothAdvertiser?.stopAdvertising(object : AdvertiseCallback() {})
    }

    @ReactMethod
    fun scheduleClassAttendanceWorks(uuid: String) {
      val workManager = WorkManager.getInstance(getReactApplicationContext())

      // Definir el horario de las clases.
      val classStartTimes = arrayOf(
          Pair(18, 0), // 15:30
          Pair(18, 15), // 16:30
          Pair(18, 30), // 17:30
          Pair(18, 45)  // 18:15
      )

      val now = Calendar.getInstance()

      for ((hour, minute) in classStartTimes) {
          val classTime = Calendar.getInstance().apply {
              set(Calendar.HOUR_OF_DAY, hour)
              set(Calendar.MINUTE, minute)
              set(Calendar.SECOND, 0)
              set(Calendar.MILLISECOND, 0)

              // Si ya ha pasado la hora de inicio, establecer para el próximo día.
              if (before(now)) {
                  Log.d("BleModule", "Línea 95 Entro aquí")
                  add(Calendar.DAY_OF_MONTH, 1)
              }
          }

          val delay = classTime.timeInMillis - now.timeInMillis

          val scheduledTime = "$hour:$minute"
          val data = workDataOf(
              "UUID" to uuid,
              "ScheduledTime" to scheduledTime
          )

          val workRequest = OneTimeWorkRequestBuilder<BLEAdvertisingWorker>()
              .setInputData(data)
              .setInitialDelay(delay, TimeUnit.MILLISECONDS)
              .addTag("classAttendance_${hour}_${minute}")
              .build()

          // El nombre único para cada trabajo incluye la hora y los minutos de inicio de la clase.
          workManager.enqueueUniqueWork(
              "classAttendance_${hour}_${minute}",
              ExistingWorkPolicy.REPLACE,
              workRequest
          )
      }
    }
}
