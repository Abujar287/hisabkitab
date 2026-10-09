package com.abujar.hisabkitab.data

import android.content.Context
import android.content.SharedPreferences
import com.abujar.hisabkitab.model.AppLanguage
import com.abujar.hisabkitab.model.AppUser
import com.abujar.hisabkitab.model.Transaction
import com.abujar.hisabkitab.model.TransactionType
import com.abujar.hisabkitab.utils.FormatUtils
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class HisabRepository(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("hisab_kitab_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    // Language
    fun getLanguage(): AppLanguage {
        val langStr = prefs.getString("app_language", "en") ?: "en"
        return if (langStr == "bn") AppLanguage.BN else AppLanguage.EN
    }

    fun setLanguage(lang: AppLanguage) {
        prefs.edit().putString("app_language", if (lang == AppLanguage.BN) "bn" else "en").apply()
    }

    // Users
    fun getUsers(): List<AppUser> {
        val json = prefs.getString("app_registered_users_v2", null)
        if (!json.isNullOrBlank()) {
            try {
                val type = object : TypeToken<List<AppUser>>() {}.type
                val list: List<AppUser>? = gson.fromJson(json, type)
                if (!list.isNullOrEmpty()) return list
            } catch (_: Exception) {}
        }
        val defaultList = listOf(Constants.DEFAULT_ADMIN)
        saveUsers(defaultList)
        return defaultList
    }

    fun saveUsers(users: List<AppUser>) {
        val json = gson.toJson(users)
        prefs.edit().putString("app_registered_users_v2", json).apply()
    }

    fun getActiveUser(): AppUser {
        val json = prefs.getString("active_user_v2", null)
        if (!json.isNullOrBlank()) {
            try {
                val user = gson.fromJson(json, AppUser::class.java)
                if (user != null) return user
            } catch (_: Exception) {}
        }
        return Constants.DEFAULT_ADMIN
    }

    fun saveActiveUser(user: AppUser) {
        val json = gson.toJson(user)
        prefs.edit().putString("active_user_v2", json).apply()
    }

    // Categories
    fun getExpenseCategories(tab: String): List<String> {
        val json = prefs.getString("app_expense_categories_$tab", null)
        if (!json.isNullOrBlank()) {
            try {
                val type = object : TypeToken<List<String>>() {}.type
                val list: List<String>? = gson.fromJson(json, type)
                if (!list.isNullOrEmpty()) return list
            } catch (_: Exception) {}
        }
        return Constants.DEFAULT_EXPENSE_CATEGORIES
    }

    fun saveExpenseCategories(tab: String, list: List<String>) {
        prefs.edit().putString("app_expense_categories_$tab", gson.toJson(list)).apply()
    }

    fun getIncomeCategories(tab: String): List<String> {
        val json = prefs.getString("app_income_categories_$tab", null)
        if (!json.isNullOrBlank()) {
            try {
                val type = object : TypeToken<List<String>>() {}.type
                val list: List<String>? = gson.fromJson(json, type)
                if (!list.isNullOrEmpty()) return list
            } catch (_: Exception) {}
        }
        return Constants.DEFAULT_INCOME_CATEGORIES
    }

    fun saveIncomeCategories(tab: String, list: List<String>) {
        prefs.edit().putString("app_income_categories_$tab", gson.toJson(list)).apply()
    }

    // Transactions
    fun getTransactions(tab: String): List<Transaction> {
        val json = prefs.getString("app_transactions_$tab", null)
        if (!json.isNullOrBlank()) {
            try {
                val type = object : TypeToken<List<Transaction>>() {}.type
                val list: List<Transaction>? = gson.fromJson(json, type)
                if (list != null) return list
            } catch (_: Exception) {}
        }
        return emptyList()
    }

    fun saveTransactions(tab: String, transactions: List<Transaction>) {
        val json = gson.toJson(transactions)
        prefs.edit().putString("app_transactions_$tab", json).apply()
    }

    // Cloud Sync
    suspend fun fetchTransactionsFromCloud(tab: String): List<Transaction>? = withContext(Dispatchers.IO) {
        try {
            val url = "${Constants.GOOGLE_SCRIPT_URL}?action=getDetails&sheetTab=$tab"
            val request = Request.Builder().url(url).get().build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext null
                val bodyStr = response.body?.string() ?: return@withContext null
                val mapType = object : TypeToken<Map<String, Any>>() {}.type
                val map: Map<String, Any> = gson.fromJson(bodyStr, mapType)
                if (map["result"] == "success" && map.containsKey("transactions")) {
                    val txListRaw = map["transactions"] as? List<*> ?: emptyList<Any>()
                    val parsed = txListRaw.mapNotNull { item ->
                        try {
                            val itemMap = item as? Map<*, *> ?: return@mapNotNull null
                            val id = itemMap["id"]?.toString() ?: System.currentTimeMillis().toString()
                            val datetime = itemMap["datetime"]?.toString() ?: ""
                            val typeStr = itemMap["type"]?.toString() ?: "Expense"
                            val type = if (typeStr.equals("Income", ignoreCase = true)) TransactionType.Income else TransactionType.Expense
                            val category = itemMap["category"]?.toString() ?: "Others"
                            val rawDate = itemMap["date"]?.toString()
                            val date = FormatUtils.normalizeDate(rawDate)
                            val value = itemMap["value"]?.toString()?.toDoubleOrNull() ?: 0.0
                            val note = itemMap["note"]?.toString() ?: ""
                            Transaction(id, datetime, type, category, date, value, note)
                        } catch (_: Exception) {
                            null
                        }
                    }
                    return@withContext parsed
                }
            }
        } catch (_: Exception) {}
        return@withContext null
    }

    suspend fun postToCloud(payload: Map<String, Any?>): Boolean = withContext(Dispatchers.IO) {
        try {
            val json = gson.toJson(payload)
            val body = json.toRequestBody("application/json; charset=utf-8".toMediaType())
            val request = Request.Builder()
                .url(Constants.GOOGLE_SCRIPT_URL)
                .post(body)
                .build()
            client.newCall(request).execute().use { response ->
                return@withContext response.isSuccessful
            }
        } catch (_: Exception) {
            return@withContext false
        }
    }
}
