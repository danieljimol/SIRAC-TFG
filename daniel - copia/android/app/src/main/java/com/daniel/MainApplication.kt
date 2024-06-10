package com.daniel

import android.app.Application
import android.content.res.Configuration
import androidx.annotation.NonNull

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.flipper.ReactNativeFlipper
import com.facebook.soloader.SoLoader

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

import com.daniel.BleModulePackage
import android.util.Log;

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
          override fun getPackages(): List<ReactPackage> {
            val packages = PackageList(this).packages
            // Aquí es donde añades tus paquetes no autolinked.
            packages.add(BleModulePackage())
            return packages
          }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
          override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = getDefaultReactHost(this.applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    if (!BuildConfig.REACT_NATIVE_UNSTABLE_USE_RUNTIME_SCHEDULER_ALWAYS) {
      ReactFeatureFlags.unstable_useRuntimeSchedulerAlways = false
    }
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
    if (BuildConfig.DEBUG) {
      ReactNativeFlipper.initializeFlipper(this, reactNativeHost.reactInstanceManager)
    }
    
    Log.d("MainApplication", "Línea 66 Añado el canal de notificación")
    createNotificationChannel()
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }

  private fun createNotificationChannel() {
      Log.d("MainApplication", "Línea 77 Configuro el canal notificación")

      // Crear el NotificationChannel, pero solo en API 26+ porque
      // la clase NotificationChannel es nueva y no está en la biblioteca de soporte
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          val name = "AttendanceChannel"
          val descriptionText = "Channel for Class Attendance Notifications"
          val importance = NotificationManager.IMPORTANCE_DEFAULT
          val channel = NotificationChannel("ATTENDANCE_CHANNEL_ID", name, importance).apply {
              description = descriptionText
          }
          // Registrar el canal con el sistema
          val notificationManager: NotificationManager =
              getSystemService(NOTIFICATION_SERVICE) as NotificationManager
          notificationManager.createNotificationChannel(channel)
      }
    }
}
