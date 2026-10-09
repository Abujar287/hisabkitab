package com.abujar.hisabkitab.model

enum class TransactionType {
    Expense,
    Income
}

data class Transaction(
    val id: String,
    val datetime: String = "",
    val type: TransactionType,
    val category: String,
    val date: String, // YYYY-MM-DD
    val value: Double,
    val note: String = ""
)

data class DaySummary(
    val day: Int,
    val dateStr: String,
    val dayOfWeek: String,
    val exp: Double,
    val inc: Double,
    val net: Double,
    val count: Int,
    val hasActivity: Boolean
)

data class AppUser(
    val username: String,
    val password: String,
    val displayName: String,
    val sheetTab: String,
    val initialUsername: String = username,
    val createdAt: String,
    val role: String = "member", // admin or member
    val isActive: Boolean = true
)

enum class SummaryScope {
    MONTH,
    ALL
}

enum class AppLanguage {
    EN,
    BN
}
