package com.trustosapp

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.view.View
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject
import java.text.NumberFormat
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

            // PendingIntent to launch main app when tapping widget container
            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingOpenIntent = PendingIntent.getActivity(
                context,
                0,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingOpenIntent)

            // PendingIntent to launch main app for creating a new note
            val addNoteIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("action", "create_note")
            }
            val pendingAddIntent = PendingIntent.getActivity(
                context,
                1,
                addNoteIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_add_btn, pendingAddIntent)

            // PendingIntent to refresh widget
            val refreshIntent = Intent(context, LedgerWidgetProvider::class.java).apply {
                action = ACTION_REFRESH_WIDGET
            }
            val pendingRefreshIntent = PendingIntent.getBroadcast(
                context,
                2,
                refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_refresh_btn, pendingRefreshIntent)

            // Read notes and theme from SharedPreferences
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val notesJsonString = prefs.getString(KEY_NOTES_DATA, "[]") ?: "[]"
            val themeMode = prefs.getString(KEY_THEME_MODE, "dark") ?: "dark"

            val isLight = themeMode.equals("light", ignoreCase = true)

            // Apply Background Drawable based on theme
            val bgDrawable = if (isLight) R.drawable.widget_background_light else R.drawable.widget_background_dark
            views.setInt(R.id.widget_container, "setBackgroundResource", bgDrawable)

            // Theme colors
            val titleColor = if (isLight) Color.parseColor("#0F172A") else Color.parseColor("#FFFFFF")
            val subtitleColor = if (isLight) Color.parseColor("#64748B") else Color.parseColor("#9CA3AF")
            val noteTitleColor = if (isLight) Color.parseColor("#1E293B") else Color.parseColor("#E5E7EB")
            val sepColor = if (isLight) Color.parseColor("#E2E8F0") else Color.parseColor("#232A3B")
            val posColor = if (isLight) Color.parseColor("#059669") else Color.parseColor("#34D399")
            val negColor = if (isLight) Color.parseColor("#DC2626") else Color.parseColor("#F87171")
            val neutralColor = if (isLight) Color.parseColor("#64748B") else Color.parseColor("#9CA3AF")

            // Apply Theme Colors
            views.setTextColor(R.id.widget_title, titleColor)
            views.setTextColor(R.id.widget_subtitle, subtitleColor)
            views.setTextColor(R.id.widget_empty_title, subtitleColor)
            views.setTextColor(R.id.widget_empty_subtitle, neutralColor)
            views.setTextColor(R.id.widget_footer_label, subtitleColor)

            views.setInt(R.id.sep1, "setBackgroundColor", sepColor)
            views.setInt(R.id.sep2, "setBackgroundColor", sepColor)
            views.setInt(R.id.sep_footer, "setBackgroundColor", sepColor)

            try {
                val jsonArray = JSONArray(notesJsonString)
                var netTotal = 0.0

                // Calculate net total for all notes in jsonArray
                for (i in 0 until jsonArray.length()) {
                    val noteObj = jsonArray.getJSONObject(i)
                    val content = noteObj.optString("content", "")
                    netTotal += calculateTotalFromContent(content)
                }

                val count = minOf(jsonArray.length(), 3)
                if (count == 0) {
                    views.setViewVisibility(R.id.widget_empty_view, View.VISIBLE)
                    views.setViewVisibility(R.id.widget_notes_list_container, View.GONE)
                } else {
                    views.setViewVisibility(R.id.widget_empty_view, View.GONE)
                    views.setViewVisibility(R.id.widget_notes_list_container, View.VISIBLE)

                    // Bind Row 1
                    if (count >= 1) {
                        bindNoteRow(views, jsonArray.getJSONObject(0), R.id.note1_container, R.id.note1_title, R.id.note1_total, noteTitleColor, posColor, negColor, neutralColor)
                        views.setViewVisibility(R.id.note1_container, View.VISIBLE)
                    } else {
                        views.setViewVisibility(R.id.note1_container, View.GONE)
                    }

                    // Bind Row 2 & Divider 1
                    if (count >= 2) {
                        views.setViewVisibility(R.id.sep1, View.VISIBLE)
                        bindNoteRow(views, jsonArray.getJSONObject(1), R.id.note2_container, R.id.note2_title, R.id.note2_total, noteTitleColor, posColor, negColor, neutralColor)
                        views.setViewVisibility(R.id.note2_container, View.VISIBLE)
                    } else {
                        views.setViewVisibility(R.id.sep1, View.GONE)
                        views.setViewVisibility(R.id.note2_container, View.GONE)
                    }

                    // Bind Row 3 & Divider 2
                    if (count >= 3) {
                        views.setViewVisibility(R.id.sep2, View.VISIBLE)
                        bindNoteRow(views, jsonArray.getJSONObject(2), R.id.note3_container, R.id.note3_title, R.id.note3_total, noteTitleColor, posColor, negColor, neutralColor)
                        views.setViewVisibility(R.id.note3_container, View.VISIBLE)
                    } else {
                        views.setViewVisibility(R.id.sep2, View.GONE)
                        views.setViewVisibility(R.id.note3_container, View.GONE)
                    }
                }

                // Update Footer Total
                val formattedNetTotal = formatCurrency(netTotal)
                views.setTextViewText(R.id.widget_footer_total, formattedNetTotal)
                val footerColor = if (netTotal > 0) posColor else if (netTotal < 0) negColor else neutralColor
                views.setTextColor(R.id.widget_footer_total, footerColor)

            } catch (e: Exception) {
                e.printStackTrace()
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun bindNoteRow(
            views: RemoteViews,
            noteObj: JSONObject,
            containerId: Int,
            titleId: Int,
            totalId: Int,
            titleColor: Int,
            posColor: Int,
            negColor: Int,
            neutralColor: Int
        ) {
            val title = noteObj.optString("title", "Untitled").ifEmpty { "Untitled" }
            val content = noteObj.optString("content", "")
            val total = calculateTotalFromContent(content)

            views.setTextViewText(titleId, title)
            views.setTextColor(titleId, titleColor)

            val formattedTotal = formatCurrency(total)
            views.setTextViewText(totalId, formattedTotal)

            if (total > 0) {
                views.setTextColor(totalId, posColor)
                views.setInt(totalId, "setBackgroundResource", R.drawable.widget_badge_green)
            } else if (total < 0) {
                views.setTextColor(totalId, negColor)
                views.setInt(totalId, "setBackgroundResource", R.drawable.widget_badge_red)
            } else {
                views.setTextColor(totalId, neutralColor)
                views.setInt(totalId, "setBackgroundResource", R.drawable.widget_badge_gray)
            }
        }

        private fun formatCurrency(amount: Double): String {
            val absAmount = Math.abs(amount)
            val formatter = NumberFormat.getNumberInstance(Locale.getDefault())
            formatter.maximumFractionDigits = 2
            formatter.minimumFractionDigits = 0
            val formattedStr = formatter.format(absAmount)

            return when {
                amount > 0 -> "+₹$formattedStr"
                amount < 0 -> "-₹$formattedStr"
                else -> "₹0"
            }
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
