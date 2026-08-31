package com.trustosapp

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.widget.RemoteViews
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class LedgerWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (ACTION_REFRESH_WIDGET == intent.action) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, LedgerWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)

            // Save refresh timestamp
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putLong(KEY_LAST_UPDATED, System.currentTimeMillis()).apply()

            // Refresh ListView data & update widget
            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId)
            }
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_list_view)
        }
    }

    companion object {
        const val PREFS_NAME = "ledger_widget_prefs"
        const val KEY_NOTES_DATA = "notes_data"
        const val KEY_THEME_MODE = "theme_mode"
        const val KEY_LAST_UPDATED = "last_updated_time"
        const val ACTION_REFRESH_WIDGET = "com.trustosapp.ACTION_REFRESH_WIDGET"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.ledger_widget)

            // PendingIntent to launch main app dashboard when tapping widget background
            val openAppIntent = Intent(Intent.ACTION_VIEW, Uri.parse("ledger://home"), context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingOpenIntent = PendingIntent.getActivity(
                context,
                10,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingOpenIntent)

            // PendingIntent to launch main app for creating a new note (+ New button)
            val addNoteIntent = Intent(Intent.ACTION_VIEW, Uri.parse("ledger://note/new?fromWidget=true"), context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingAddIntent = PendingIntent.getActivity(
                context,
                11,
                addNoteIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_add_btn, pendingAddIntent)
            views.setOnClickPendingIntent(R.id.widget_empty_view, pendingAddIntent)

            // PendingIntent to refresh widget
            val refreshIntent = Intent(context, LedgerWidgetProvider::class.java).apply {
                action = ACTION_REFRESH_WIDGET
            }
            val pendingRefreshIntent = PendingIntent.getBroadcast(
                context,
                12,
                refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_refresh_btn, pendingRefreshIntent)

            // Read preferences
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val themeMode = prefs.getString(KEY_THEME_MODE, "dark") ?: "dark"
            val lastUpdatedMs = prefs.getLong(KEY_LAST_UPDATED, System.currentTimeMillis())
            val isLight = themeMode.equals("light", ignoreCase = true)

            // Background Drawable on Container
            views.setInt(
                R.id.widget_container,
                "setBackgroundResource",
                if (isLight) R.drawable.widget_background_light else R.drawable.widget_background_dark
            )

            // Header Colors
            val titleColor = if (isLight) Color.parseColor("#0F172A") else Color.parseColor("#FFFFFF")
            val subtitleColor = if (isLight) Color.parseColor("#64748B") else Color.parseColor("#A1A1AA")

            views.setTextColor(R.id.widget_title, titleColor)
            val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())
            val formattedTimeStr = "• Updated " + timeFormat.format(Date(lastUpdatedMs))
            views.setTextViewText(R.id.widget_last_updated, formattedTimeStr)
            views.setTextColor(R.id.widget_last_updated, subtitleColor)
            views.setTextColor(R.id.widget_empty_title, subtitleColor)

            // Setup ListView RemoteViewsService with explicit data URI & Widget ID
            val serviceIntent = Intent(context, LedgerWidgetService::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                data = Uri.parse(toUri(Intent.URI_INTENT_SCHEME))
            }
            views.setRemoteAdapter(R.id.widget_list_view, serviceIntent)
            views.setEmptyView(R.id.widget_list_view, R.id.widget_empty_view)

            // ListView Item PendingIntent Template for deep linking to specific contact/note
            val noteDetailIntent = Intent(Intent.ACTION_VIEW, null, context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntentTemplate = PendingIntent.getActivity(
                context,
                20,
                noteDetailIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            )
            views.setPendingIntentTemplate(R.id.widget_list_view, pendingIntentTemplate)

            // Update AppWidget
            appWidgetManager.notifyAppWidgetViewDataChanged(intArrayOf(appWidgetId), R.id.widget_list_view)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
