package com.trustosapp

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class LedgerWidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "LedgerWidget"
    }

    @ReactMethod
    fun updateWidget(notesJson: String, themeMode: String) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences(LedgerWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(LedgerWidgetProvider.KEY_NOTES_DATA, notesJson)
            .putString(LedgerWidgetProvider.KEY_THEME_MODE, themeMode)
            .apply()

        // Trigger AppWidget update
        val intent = Intent(context, LedgerWidgetProvider::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        }
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val ids = appWidgetManager.getAppWidgetIds(ComponentName(context, LedgerWidgetProvider::class.java))
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        context.sendBroadcast(intent)
    }
}
