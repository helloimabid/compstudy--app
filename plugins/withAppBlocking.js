const {
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
  AndroidConfig,
} = require("@expo/config-plugins");
const { mkdirSync, writeFileSync, existsSync, readFileSync } = require("fs");
const { join } = require("path");

// Kotlin code for the AppBlockingModule
const APP_BLOCKING_MODULE_KT = `package com.compstudy.compstudy.appblocking

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class AppBlockingModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        var blockedApps: Set<String> = emptySet()
        var isBlockingEnabled: Boolean = false
        var reactContext: ReactApplicationContext? = null
    }

    init {
        Companion.reactContext = reactContext
    }

    override fun getName(): String = "AppBlockingModule"

    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        try {
            val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    reactApplicationContext.packageName
                )
            } else {
                @Suppress("DEPRECATION")
                appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    reactApplicationContext.packageName
                )
            }
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        try {
            val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(reactApplicationContext)
            } else {
                true
            }
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openUsageStatsSettings() {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            // Fallback to app settings
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            intent.data = Uri.parse("package:\${reactApplicationContext.packageName}")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun openOverlaySettings() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:\${reactApplicationContext.packageName}")
                )
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
            }
        } catch (e: Exception) {
            // Fallback
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            intent.data = Uri.parse("package:\${reactApplicationContext.packageName}")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun setBlockedApps(apps: ReadableArray, promise: Promise) {
        try {
            val appsList = mutableSetOf<String>()
            for (i in 0 until apps.size()) {
                apps.getString(i)?.let { appsList.add(it) }
            }
            blockedApps = appsList
            
            // Save to SharedPreferences
            val prefs = reactApplicationContext.getSharedPreferences("app_blocking", Context.MODE_PRIVATE)
            prefs.edit().putStringSet("blocked_apps", appsList).apply()
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun setBlockingEnabled(enabled: Boolean, promise: Promise) {
        try {
            isBlockingEnabled = enabled
            
            // Save to SharedPreferences
            val prefs = reactApplicationContext.getSharedPreferences("app_blocking", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("blocking_enabled", enabled).apply()
            
            // Start or stop the service
            val serviceIntent = Intent(reactApplicationContext, AppBlockingService::class.java)
            if (enabled) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    reactApplicationContext.startForegroundService(serviceIntent)
                } else {
                    reactApplicationContext.startService(serviceIntent)
                }
            } else {
                reactApplicationContext.stopService(serviceIntent)
            }
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getBlockingStatus(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("app_blocking", Context.MODE_PRIVATE)
            val map = Arguments.createMap()
            map.putBoolean("enabled", prefs.getBoolean("blocking_enabled", false))
            
            val blockedSet = prefs.getStringSet("blocked_apps", emptySet()) ?: emptySet()
            val appsArray = Arguments.createArray()
            blockedSet.forEach { appsArray.pushString(it) }
            map.putArray("blockedApps", appsArray)
            
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN event emitter
    }

    fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
`;

// Kotlin code for the AppBlockingService
const APP_BLOCKING_SERVICE_KT = `package com.compstudy.compstudy.appblocking

import android.app.*
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.compstudy.compstudy.R

class AppBlockingService : Service() {
    
    private val handler = Handler(Looper.getMainLooper())
    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var isOverlayShowing = false
    private var currentBlockedApp: String? = null
    
    private val CHANNEL_ID = "app_blocking_channel"
    private val NOTIFICATION_ID = 1001
    private val CHECK_INTERVAL = 500L // Check every 500ms
    
    private val checkRunnable = object : Runnable {
        override fun run() {
            checkForegroundApp()
            handler.postDelayed(this, CHECK_INTERVAL)
        }
    }
    
    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        loadBlockedApps()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
        handler.post(checkRunnable)
        return START_STICKY
    }
    
    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(checkRunnable)
        hideOverlay()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    private fun loadBlockedApps() {
        val prefs = getSharedPreferences("app_blocking", Context.MODE_PRIVATE)
        AppBlockingModule.blockedApps = prefs.getStringSet("blocked_apps", emptySet()) ?: emptySet()
        AppBlockingModule.isBlockingEnabled = prefs.getBoolean("blocking_enabled", false)
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "App Blocking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when app blocking is active"
                setShowBadge(false)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(): Notification {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Focus Mode Active")
            .setContentText("Blocking distracting apps")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
    
    private fun checkForegroundApp() {
        if (!AppBlockingModule.isBlockingEnabled) {
            hideOverlay()
            return
        }
        
        val foregroundApp = getForegroundApp()
        
        if (foregroundApp != null && foregroundApp != packageName) {
            // Check if this app is in blocked list
            val isBlocked = AppBlockingModule.blockedApps.any { blocked ->
                foregroundApp.contains(blocked, ignoreCase = true) ||
                blocked.contains(foregroundApp, ignoreCase = true)
            }
            
            if (isBlocked && !isOverlayShowing) {
                currentBlockedApp = foregroundApp
                showOverlay(foregroundApp)
            } else if (!isBlocked && isOverlayShowing) {
                hideOverlay()
            }
        } else if (foregroundApp == packageName && isOverlayShowing) {
            hideOverlay()
        }
    }
    
    private fun getForegroundApp(): String? {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val endTime = System.currentTimeMillis()
        val beginTime = endTime - 10000 // Last 10 seconds
        
        val usageEvents = usageStatsManager.queryEvents(beginTime, endTime)
        var lastApp: String? = null
        
        while (usageEvents.hasNextEvent()) {
            val event = UsageEvents.Event()
            usageEvents.getNextEvent(event)
            
            if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND ||
                event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                lastApp = event.packageName
            }
        }
        
        return lastApp
    }
    
    private fun showOverlay(appPackage: String) {
        if (isOverlayShowing) return
        
        try {
            val layoutParams = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.CENTER
            }
            
            overlayView = LayoutInflater.from(this).inflate(R.layout.blocking_overlay, null)
            
            overlayView?.let { view ->
                val appName = try {
                    val pm = packageManager
                    val appInfo = pm.getApplicationInfo(appPackage, 0)
                    pm.getApplicationLabel(appInfo).toString()
                } catch (e: Exception) {
                    appPackage
                }
                
                view.findViewById<TextView>(R.id.blockedAppName)?.text = appName
                
                view.findViewById<Button>(R.id.returnToStudyBtn)?.setOnClickListener {
                    hideOverlay()
                    // Open our app
                    val intent = packageManager.getLaunchIntentForPackage(packageName)
                    intent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    startActivity(intent)
                }
                
                windowManager?.addView(view, layoutParams)
                isOverlayShowing = true
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    private fun hideOverlay() {
        if (!isOverlayShowing) return
        
        try {
            overlayView?.let {
                windowManager?.removeView(it)
            }
            overlayView = null
            isOverlayShowing = false
            currentBlockedApp = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
`;

// Kotlin code for the Package
const APP_BLOCKING_PACKAGE_KT = `package com.compstudy.compstudy.appblocking

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class AppBlockingPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(AppBlockingModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

// XML layout for the blocking overlay
const BLOCKING_OVERLAY_XML = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:background="#F0111827"
    android:padding="32dp">

    <ImageView
        android:layout_width="80dp"
        android:layout_height="80dp"
        android:src="@android:drawable/ic_lock_lock"
        android:tint="#EF4444"
        android:layout_marginBottom="24dp" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="App Blocked"
        android:textSize="28sp"
        android:textStyle="bold"
        android:textColor="#FFFFFF"
        android:layout_marginBottom="8dp" />

    <TextView
        android:id="@+id/blockedAppName"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="This app"
        android:textSize="18sp"
        android:textColor="#9CA3AF"
        android:layout_marginBottom="16dp" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="This app is blocked during your focus session.\\nStay focused on your studies!"
        android:textSize="16sp"
        android:textColor="#D1D5DB"
        android:gravity="center"
        android:layout_marginBottom="32dp" />

    <Button
        android:id="@+id/returnToStudyBtn"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Return to Study"
        android:textSize="16sp"
        android:textColor="#FFFFFF"
        android:background="@android:drawable/btn_default"
        android:backgroundTint="#6366F1"
        android:paddingHorizontal="32dp"
        android:paddingVertical="12dp" />

</LinearLayout>
`;

function withAppBlockingAndroid(config) {
  // Add Android Manifest permissions and service
  config = withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    // Add permissions
    const permissions = [
      "android.permission.PACKAGE_USAGE_STATS",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_SPECIAL_USE",
      "android.permission.RECEIVE_BOOT_COMPLETED",
    ];

    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    permissions.forEach((permission) => {
      const exists = manifest["uses-permission"].some(
        (p) => p.$?.["android:name"] === permission,
      );
      if (!exists) {
        manifest["uses-permission"].push({
          $: { "android:name": permission },
        });
      }
    });

    // Add the service to the application
    const application = manifest.application?.[0];
    if (application) {
      if (!application.service) {
        application.service = [];
      }

      // Check if service already exists
      const serviceExists = application.service.some(
        (s) => s.$?.["android:name"] === ".appblocking.AppBlockingService",
      );

      if (!serviceExists) {
        application.service.push({
          $: {
            "android:name": ".appblocking.AppBlockingService",
            "android:enabled": "true",
            "android:exported": "false",
            "android:foregroundServiceType": "specialUse",
          },
          property: [
            {
              $: {
                "android:name": "android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE",
                "android:value": "app_blocking",
              },
            },
          ],
        });
      }
    }

    return config;
  });

  return config;
}

module.exports = function withAppBlocking(config) {
  config = withAppBlockingAndroid(config);

  // Use withDangerousMod to write the Kotlin files and modify MainApplication
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packageName = config.android?.package || "com.compstudy.compstudy";
      const packagePath = packageName.replace(/\./g, "/");

      // Create directories
      const kotlinDir = join(
        projectRoot,
        "android/app/src/main/java",
        packagePath,
        "appblocking",
      );
      const layoutDir = join(projectRoot, "android/app/src/main/res/layout");

      if (!existsSync(kotlinDir)) {
        mkdirSync(kotlinDir, { recursive: true });
      }
      if (!existsSync(layoutDir)) {
        mkdirSync(layoutDir, { recursive: true });
      }

      // Write Kotlin files
      writeFileSync(
        join(kotlinDir, "AppBlockingModule.kt"),
        APP_BLOCKING_MODULE_KT,
      );
      writeFileSync(
        join(kotlinDir, "AppBlockingService.kt"),
        APP_BLOCKING_SERVICE_KT,
      );
      writeFileSync(
        join(kotlinDir, "AppBlockingPackage.kt"),
        APP_BLOCKING_PACKAGE_KT,
      );

      // Write layout XML
      writeFileSync(
        join(layoutDir, "blocking_overlay.xml"),
        BLOCKING_OVERLAY_XML,
      );

      // Modify MainApplication.kt to register the package
      const mainAppPath = join(
        projectRoot,
        "android/app/src/main/java",
        packagePath,
        "MainApplication.kt",
      );

      if (existsSync(mainAppPath)) {
        let mainAppContent = readFileSync(mainAppPath, "utf-8");

        // Add import if not present
        const importStatement = `import ${packageName}.appblocking.AppBlockingPackage`;
        if (!mainAppContent.includes(importStatement)) {
          // Add import after the package declaration
          mainAppContent = mainAppContent.replace(
            /^(package .+\n)/m,
            `$1\n${importStatement}\n`,
          );
        }

        // Add the package to getPackages() if not present
        if (!mainAppContent.includes("add(AppBlockingPackage())")) {
          // Find the getPackages function and add the package
          mainAppContent = mainAppContent.replace(
            /PackageList\(this\)\.packages\.apply\s*\{/,
            `PackageList(this).packages.apply {\n              // Add native app blocking module\n              add(AppBlockingPackage())`,
          );
        }

        writeFileSync(mainAppPath, mainAppContent);
      }

      return config;
    },
  ]);

  return config;
};
