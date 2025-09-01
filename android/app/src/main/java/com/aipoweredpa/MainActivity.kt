package com.aipoweredpa

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.google.android.gms.tasks.OnCompleteListener
import com.google.android.gms.tasks.Task
import com.google.firebase.messaging.FirebaseMessaging

class MainActivity : ReactActivity() {

  companion object {
    private const val TAG = "MainActivity"
  }

  // Declare the launcher for notification permission
  private val requestPermissionLauncher: ActivityResultLauncher<String> =
      registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
          if (isGranted) {
              // FCM SDK (and your app) can post notifications.
              getFCMToken()
          } else {
              // TODO: Inform user that your app will not show notifications.
          }
      }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "AIPOWEREDPA"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
      super.onCreate(savedInstanceState)
      askNotificationPermission()
      getFCMToken()
  }

  private fun getFCMToken() {
      FirebaseMessaging.getInstance().token
          .addOnCompleteListener(OnCompleteListener { task ->
              if (!task.isSuccessful) {
                  Log.w(TAG, "Fetching FCM registration token failed", task.exception)
                  return@OnCompleteListener
              }

              // Get new FCM registration token
              val token = task.result

              // Log and toast
              val msg = "FCM Registration Token: $token"
              Log.d(TAG, msg)
              Toast.makeText(this@MainActivity, msg, Toast.LENGTH_SHORT).show()
          })
  }

  private fun askNotificationPermission() {
      // This is only necessary for API level >= 33 (TIRAMISU)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) ==
                  PackageManager.PERMISSION_GRANTED) {
              // FCM SDK (and your app) can post notifications.
              getFCMToken()
          } else if (shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)) {
              // TODO: display an educational UI explaining to the user the features that will be enabled
              //       by them granting the POST_NOTIFICATION permission. This UI should provide the user
              //       "OK" and "No thanks" buttons. If the user selects "OK," directly request the permission.
              //       If the user selects "No thanks," allow the user to continue without notifications.
          } else {
              // Directly ask for the permission
              requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
          }
      } else {
          // For older Android versions, get FCM token directly
          getFCMToken()
      }
  }
}
