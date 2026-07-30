package com.trustosapp

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject

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
            onUpdate(context, appWidgetManager, appWidgetIds)
        }
    }

    companion object {
        const val PREFS_NAME = "ledger_widget_prefs"
        const val KEY_NOTES_DATA = "notes_data"
        const val KEY_THEME_MODE = "theme_mode"
        const val ACTION_REFRESH_WIDGET = "com.trustosapp.ACTION_REFRESH_WIDGET"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.ledger_widget)

            // PendingIntent to launch main app when tapping widget
            val openAppIntent = Intent(context, MainActivity::class.java)
            val pendingOpenIntent = PendingIntent.getActivity(
                context,
                0,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingOpenIntent)

            // PendingIntent to refresh widget
            val refreshIntent = Intent(context, LedgerWidgetProvider::class.java).apply {
                action = ACTION_REFRESH_WIDGET
            }
            val pendingRefreshIntent = PendingIntent.getBroadcast(
                context,
                0,
                refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_refresh_btn, pendingRefreshIntent)

            // Read notes and theme from SharedPreferences
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val notesJsonString = prefs.getString(KEY_NOTES_DATA, "[]") ?: "[]"
            val themeMode = prefs.getString(KEY_THEME_MODE, "dark") ?: "dark"

            val isLight = themeMode.equals("light", ignoreCase = true)

            // Theme colors
            val bgColor = if (isLight) Color.parseColor("#FFFFFF") else Color.parseColor("#151923")
            val titleColor = if (isLight) Color.parseColor("#0F172A") else Color.parseColor("#FFFFFF")
            val subtitleColor = if (isLight) Color.parseColor("#64748B") else Color.parseColor("#9CA3AF")
            val noteTitleColor = if (isLight) Color.parseColor("#1E293B") else Color.parseColor("#E5E7EB")
            val sepColor = if (isLight) Color.parseColor("#E2E8F0") else Color.parseColor("#232A3B")
            val posColor = if (isLight) Color.parseColor("#059669") else Color.parseColor("#34D399")
            val negColor = if (isLight) Color.parseColor("#DC2626") else Color.parseColor("#F87171")

            // Apply Theme Colors
            views.setInt(R.id.widget_container, "setBackgroundColor", bgColor)
            views.setTextColor(R.id.widget_title, titleColor)
            views.setTextColor(R.id.widget_subtitle, subtitleColor)
            views.setInt(R.id.sep1, "setBackgroundColor", sepColor)
            views.setInt(R.id.sep2, "setBackgroundColor", sepColor)

            try {
                val jsonArray = JSONArray(notesJsonString)

                // Clear/reset rows
                views.setTextViewText(R.id.note1_title, "No notes available")
                views.setTextViewText(R.id.note1_total, "")
                views.setTextColor(R.id.note1_title, noteTitleColor)
                
                views.setTextViewText(R.id.note2_title, "")
                views.setTextViewText(R.id.note2_total, "")
                views.setTextColor(R.id.note2_title, noteTitleColor)
                
                views.setTextViewText(R.id.note3_title, "")
                views.setTextViewText(R.id.note3_total, "")
                views.setTextColor(R.id.note3_title, noteTitleColor)

                val count = minOf(jsonArray.length(), 3)
                if (count == 0) {
                    views.setTextViewText(R.id.note1_title, "No notes available")
                    views.setTextViewText(R.id.note1_total, "+0")
                    views.setTextColor(R.id.note1_total, subtitleColor)
                }

                for (i in 0 until count) {
                    val noteObj: JSONObject = jsonArray.getJSONObject(i)
                    val title = noteObj.optString("title", "Untitled").ifEmpty { "Untitled" }
                    val content = noteObj.optString("content", "")
                    val total = calculateTotalFromContent(content)

                    val formattedTotal = if (total > 0) "+$total" else "$total"
                    val totalColor = if (total < 0) negColor else posColor

                    when (i) {
                        0 -> {
                            views.setTextViewText(R.id.note1_title, title)
                            views.setTextViewText(R.id.note1_total, formattedTotal)
                            views.setTextColor(R.id.note1_title, noteTitleColor)
                            views.setTextColor(R.id.note1_total, totalColor)
                        }
                        1 -> {
                            views.setTextViewText(R.id.note2_title, title)
                            views.setTextViewText(R.id.note2_total, formattedTotal)
                            views.setTextColor(R.id.note2_title, noteTitleColor)
                            views.setTextColor(R.id.note2_total, totalColor)
                        }
                        2 -> {
                            views.setTextViewText(R.id.note3_title, title)
                            views.setTextViewText(R.id.note3_total, formattedTotal)
                            views.setTextColor(R.id.note3_title, noteTitleColor)
                            views.setTextColor(R.id.note3_total, totalColor)
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun calculateTotalFromContent(content: String): Double {
            var sum = 0.0
            val lines = content.split("\n")
            for (line in lines) {
                val trimmed = line.trim()
                if (trimmed.equals("cleared", ignoreCase = true)) {
                    sum = 0.0
                    continue
                }
                val match = Regex("""[-+]?\d+(\.\d+)?""").find(trimmed)
                if (match != null) {
                    val number = match.value.toDoubleOrNull()
                    if (number != null) {
                        sum += number
                    }
                }
            }
            return sum
        }
    }
}
