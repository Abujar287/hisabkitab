package com.abujar.hisabkitab.data

import com.abujar.hisabkitab.model.AppUser

object Constants {
    const val GOOGLE_SCRIPT_URL =
        "https://script.google.com/macros/s/AKfycbwdR3oDJiUFWFopvUeLI-8r92-9uS-jRUdRKFW3CghmmIy84sQZjNEeEkY6yboG8g4z/exec"

    val DEFAULT_ADMIN = AppUser(
        username = "abujar287",
        password = "hisabkitab",
        displayName = "Abujar Al-Gifari",
        sheetTab = "abujar287",
        initialUsername = "abujar287",
        createdAt = "2026-10-01",
        role = "admin",
        isActive = true
    )

    val DEFAULT_EXPENSE_CATEGORIES = listOf(
        "🏠 Room Rent",
        "🛒 Bajar",
        "🍲 Food",
        "👤 Personal",
        "📶 WiFi",
        "⚡ Electricity",
        "💊 Medicines",
        "🚗 Transport",
        "🛍️ Shopping",
        "🏷️ Others"
    )

    val DEFAULT_INCOME_CATEGORIES = listOf(
        "💰 Salary",
        "📈 Arrear",
        "🤝 Borrowed Money",
        "🤝 Loan",
        "🏷️ Other Income"
    )
}
