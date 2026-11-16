package com.ytreactnative
import android.content.res.Configuration
import expo.modules.ApplicationLifecycleDispatcher

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  /*
   * Standard RN default host: DefaultReactHost wires the package list into
   * ReactPackageTurboModuleManagerDelegate, so third-party TurboModules
   * (camera-kit, Cashfree, async-storage) resolve. ExpoReactHostFactory was
   * avoided because it hardcodes the core-only DefaultTurboModuleManagerDelegate,
   * which drops third-party TurboModules. Expo modules resolve through
   * ExpoModulesPackage in the same package list; their app-lifecycle handlers
   * still run via ApplicationLifecycleDispatcher.
   */
  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
