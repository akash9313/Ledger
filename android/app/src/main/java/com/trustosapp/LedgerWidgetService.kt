package com.trustosapp

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.net.Uri
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONArray
import org.json.JSONObject
import java.text.NumberFormat
import java.util.Locale

class LedgerWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return LedgerRemoteViewsFactory(applicationContext)
    }
}

class LedgerRemoteViewsFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {

    private val noteList = mutableListOf<JSONObject>()
    private var isLight = false

    companion object {
        private val AVATAR_COLORS = intArrayOf(
            Color.parseColor("#8B5CF6"), // Purple
            Color.parseColor("#3B82F6"), // Blue
            Color.parseColor("#10B981"), // Emerald
            Color.parseColor("#F97316"), // Orange
            Color.parseColor("#F43F5E"), // Rose
            Color.parseColor("#06B6D4"), // Cyan
            Color.parseColor("#6366F1")  // Indigo
        )
    }

    override fun onCreate() {}

    override fun onDataSetChanged() {
        noteList.clear()
        val prefs = context.getSharedPreferences(LedgerWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        val notesJsonString = prefs.getString(LedgerWidgetProvider.KEY_NOTES_DATA, "[]") ?: "[]"
        val themeMode = prefs.getString(LedgerWidgetProvider.KEY_THEME_MODE, "dark") ?: "dark"
        isLight = themeMode.equals("light", ignoreCase = true)

        try {
            val jsonArray = JSONArray(notesJsonString)
            for (i in 0 until jsonArray.length()) {
                noteList.add(jsonArray.getJSONObject(i))
            }
            noteList.sortByDescending { it.optLong("updatedAt", 0L) }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onDestroy() {
        noteList.clear()
    }

    override fun getCount(): Int = noteList.size

    override fun getViewAt(position: Int): RemoteViews? {
        if (position < 0 || position >= noteList.size) return null

        val views = RemoteViews(context.packageName, R.layout.ledger_widget_item)
        val noteObj = noteList[position]

        val noteId = noteObj.optString("id", "")
        val title = noteObj.optString("title", "Untitled").ifEmpty { "Untitled" }
        val total = if (noteObj.has("total")) noteObj.optDouble("total", 0.0) else calculateTotalFromContent(noteObj.optString("content", ""))

        // Row background
        views.setImageViewResource(
            R.id.item_row_bg,
            if (isLight) R.drawable.widget_row_bg_light else R.drawable.widget_row_bg_dark
        )

        // Circular 40dp Avatar
        val avatarBitmap = createAvatarBitmap(context, title)
        views.setImageViewBitmap(R.id.item_avatar, avatarBitmap)

        // Contact Name
        val nameColor = if (isLight) Color.parseColor("#0F172A") else Color.parseColor("#FFFFFF")
        views.setTextViewText(R.id.item_title, title)
        views.setTextColor(R.id.item_title, nameColor)

        // Outstanding Amount
        val posColor = if (isLight) Color.parseColor("#16A34A") else Color.parseColor("#22C55E")
        val negColor = if (isLight) Color.parseColor("#DC2626") else Color.parseColor("#EF4444")
        val neutralColor = if (isLight) Color.parseColor("#6B7280") else Color.parseColor("#9CA3AF")

        val formattedTotal = formatCurrency(total)
        views.setTextViewText(R.id.item_total, formattedTotal)
        val amountColor = when {
            total > 0 -> posColor
            total < 0 -> negColor
            else -> neutralColor
        }
        views.setTextColor(R.id.item_total, amountColor)

        // Fill-in Intent for deep linking to note details
        val fillInIntent = Intent().apply {
            data = Uri.parse("ledger://note/$noteId")
        }
        views.setOnClickFillInIntent(R.id.widget_item_row, fillInIntent)

        return views
    }

    override fun getLoadingView(): RemoteViews? = null

    override fun getViewTypeCount(): Int = 1

    override fun getItemId(position: Int): Long = position.toLong()

    override fun hasStableIds(): Boolean = true

    private fun createAvatarBitmap(context: Context, name: String): Bitmap {
        val density = context.resources.displayMetrics.density
        val sizePx = (40 * density).toInt().coerceAtLeast(1)
        val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        val firstChar = name.trim().firstOrNull { it.isLetterOrDigit() }?.uppercaseChar()?.toString()
            ?: name.trim().firstOrNull()?.uppercaseChar()?.toString()
            ?: "U"

        val colorIndex = Math.abs(name.hashCode()) % AVATAR_COLORS.size
        val avatarColor = AVATAR_COLORS[colorIndex]

        val circlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = avatarColor
            style = Paint.Style.FILL
        }
        val radius = sizePx / 2f
        canvas.drawCircle(radius, radius, radius, circlePaint)

        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textSize = sizePx * 0.45f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textAlign = Paint.Align.CENTER
        }

        val fontMetrics = textPaint.fontMetrics
        val baseline = radius - (fontMetrics.ascent + fontMetrics.descent) / 2f
        canvas.drawText(firstChar, radius, baseline, textPaint)

        return bitmap
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
            if (trimmed.isEmpty()) continue
            if (trimmed.equals("cleared", ignoreCase = true)) {
                sum = 0.0
                continue
            }
            val num = trimmed.toDoubleOrNull()
            if (num != null) {
                sum += num
                continue
            }
            val firstWord = trimmed.split(" ")[0]
            val firstNum = firstWord.toDoubleOrNull()
            if (firstNum != null) {
                sum += firstNum
            } else if (firstWord.equals("cleared", ignoreCase = true)) {
                sum = 0.0
            }
        }
        return sum
    }
}
