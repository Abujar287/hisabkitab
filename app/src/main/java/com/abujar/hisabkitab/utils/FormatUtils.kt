package com.abujar.hisabkitab.utils

import com.abujar.hisabkitab.model.AppLanguage
import java.text.DecimalFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object FormatUtils {
    private val BN_DIGITS = charArrayOf('০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯')
    private val BN_MONTHS = arrayOf(
        "জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন",
        "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"
    )

    fun toBengaliDigits(input: String): String {
        val sb = StringBuilder()
        for (ch in input) {
            if (ch in '0'..'9') {
                sb.append(BN_DIGITS[ch - '0'])
            } else {
                sb.append(ch)
            }
        }
        return sb.toString()
    }

    fun formatNumber(number: Double, language: AppLanguage): String {
        val df = DecimalFormat("#,##0.##")
        val formatted = df.format(number)
        return if (language == AppLanguage.BN) {
            toBengaliDigits(formatted)
        } else {
            formatted
        }
    }

    fun formatCurrency(number: Double, language: AppLanguage): String {
        val symbol = if (language == AppLanguage.BN) "৳" else "$"
        return "$symbol${formatNumber(number, language)}"
    }

    fun formatDay(day: Int, language: AppLanguage): String {
        val s = String.format(Locale.US, "%02d", day)
        return if (language == AppLanguage.BN) toBengaliDigits(s) else s
    }

    fun formatSyncDate(date: Date, language: AppLanguage): String {
        return if (language == AppLanguage.EN) {
            val sdf = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.US)
            sdf.format(date)
        } else {
            val day = toBengaliDigits(SimpleDateFormat("dd", Locale.US).format(date))
            val monthIndex = SimpleDateFormat("MM", Locale.US).format(date).toInt() - 1
            val month = BN_MONTHS.getOrElse(monthIndex) { "" }
            val year = toBengaliDigits(SimpleDateFormat("yyyy", Locale.US).format(date))
            val hour = toBengaliDigits(SimpleDateFormat("hh", Locale.US).format(date))
            val minute = toBengaliDigits(SimpleDateFormat("mm", Locale.US).format(date))
            val isPm = SimpleDateFormat("a", Locale.US).format(date).equals("PM", ignoreCase = true)
            val period = if (isPm) "অপরাহ্ন" else "পূর্বাহ্ন"
            "$day $month $year, $hour:$minute $period"
        }
    }

    fun normalizeDate(input: String?): String {
        if (input.isNullOrBlank()) {
            return SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        }
        val trimmed = input.trim()
        val isoRegex = Regex("^(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})")
        val isoMatch = isoRegex.find(trimmed)
        if (isoMatch != null) {
            val y = isoMatch.groupValues[1]
            val m = isoMatch.groupValues[2].padStart(2, '0')
            val d = isoMatch.groupValues[3].padStart(2, '0')
            return "$y-$m-$d"
        }
        return try {
            val parsed = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(trimmed)
            SimpleDateFormat("yyyy-MM-dd", Locale.US).format(parsed ?: Date())
        } catch (_: Exception) {
            SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        }
    }

    fun getCategoryEmoji(category: String): String {
        val lower = category.lowercase(Locale.ROOT)
        return when {
            lower.contains("rent") || lower.contains("রুম") -> "🏠"
            lower.contains("bajar") || lower.contains("বাজার") -> "🛒"
            lower.contains("food") || lower.contains("খাবার") -> "🍲"
            lower.contains("personal") || lower.contains("পার্সোনাল") -> "👤"
            lower.contains("wifi") || lower.contains("ওয়াইফাই") -> "📶"
            lower.contains("electricity") || lower.contains("বিদ্যুৎ") -> "⚡"
            lower.contains("medicine") || lower.contains("ঔষধ") -> "💊"
            lower.contains("transport") || lower.contains("যাতায়াত") -> "🚗"
            lower.contains("shopping") || lower.contains("শপিং") -> "🛍️"
            lower.contains("salary") || lower.contains("বেতন") -> "💰"
            lower.contains("loan") || lower.contains("ধার") -> "🤝"
            lower.contains("arrear") || lower.contains("বকেয়া") -> "📈"
            else -> "🏷️"
        }
    }
}
