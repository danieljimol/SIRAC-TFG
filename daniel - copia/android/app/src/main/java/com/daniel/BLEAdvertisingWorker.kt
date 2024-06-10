package com.daniel

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.os.ParcelUuid
import androidx.work.Worker
import androidx.work.WorkerParameters
import android.util.Log;
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

class BLEAdvertisingWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : Worker(appContext, workerParams) {

    private var bluetoothAdvertiser: BluetoothLeAdvertiser? = null
    private val advertiseCallback: AdvertiseCallback = object : AdvertiseCallback() {
        override fun onStartFailure(errorCode: Int) {
            super.onStartFailure(errorCode)
            // Log o manejo del error
        }

        override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
            super.onStartSuccess(settingsInEffect)
            // Log o confirmación del éxito
        }
    }

    override fun doWork(): Result {
        // Inicialización del BluetoothLeAdvertiser
        val bluetoothManager = applicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        val bluetoothAdapter: BluetoothAdapter? = bluetoothManager.adapter
        bluetoothAdvertiser = bluetoothAdapter?.bluetoothLeAdvertiser

        if (bluetoothAdvertiser == null) {
            // El dispositivo no soporta BLE Advertising o el Bluetooth está apagado.
            return Result.failure()
        }

        // Recupera el UUID pasado desde React Native
        val uuid = inputData.getString("UUID")
        // Recupera la hora programada
        val scheduledTime = inputData.getString("ScheduledTime") ?: "hora desconocida"

        if (uuid.isNullOrEmpty()) {
            return Result.failure()
        }

        // Configuración de la publicidad BLE
        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_BALANCED)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(true)
            .build()

        val data = AdvertiseData.Builder()
            .addServiceUuid(ParcelUuid.fromString(uuid))
            .build()

        // Iniciar la publicidad
        bluetoothAdvertiser?.startAdvertising(settings, data, advertiseCallback)

        // Simula trabajo (publicidad) durante un tiempo, p.ej., 10 segundos.
        try {
            Thread.sleep(30000)
        } catch (e: InterruptedException) {
            return Result.failure()
        }

        // Detener la publicidad después de la pausa
        bluetoothAdvertiser?.stopAdvertising(advertiseCallback)

        // Mostrar la notificación con el UUID
        showNotification("Clase en curso", "Esta es la tarea que estaba programada para las $scheduledTime")

        return Result.success()
    }

    private fun showNotification(title: String, message: String) {
        val notificationManager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val intent = applicationContext.packageManager.getLaunchIntentForPackage(applicationContext.packageName)
        val pendingIntent = PendingIntent.getActivity(applicationContext, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)

        val builder = NotificationCompat.Builder(applicationContext, "ATTENDANCE_CHANNEL_ID")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)

        notificationManager.notify(1, builder.build())
    }
}
