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
            .putLong(LedgerWidgetProvider.KEY_LAST_UPDATED, System.currentTimeMillis())
            .apply()

        // Force update all widget instances directly
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val ids = appWidgetManager.getAppWidgetIds(ComponentName(context, LedgerWidgetProvider::class.java))
        
        for (appWidgetId in ids) {
            LedgerWidgetProvider.updateAppWidget(context, appWidgetManager, appWidgetId)
        }
        
        if (ids.isNotEmpty()) {
            appWidgetManager.notifyAppWidgetViewDataChanged(ids, R.id.widget_list_view)
        }
    }
}
