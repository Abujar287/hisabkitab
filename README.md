# Expense & Income Tracker (হিসাব-নিকাশ) - Android Application

A smart, modern personal expense and income tracker built with **Kotlin** and **Jetpack Compose (Material Design 3)**, rewritten from the original web app.

## Features

- **Summary Dashboard**:
  - Live Net Balance, Total Income, and Total Expense metric cards.
  - Interactive 31-day financial calendar matrix with color indicators and detailed day-by-day modal.
  - Category breakdown with animated progress bars and percentage distribution.
  - Monthly vs All-Time scope toggles.

- **Entry & Calculator Keypad**:
  - Expense vs Income toggle pills.
  - Quick date and category selector with emojis.
  - On-screen numeric keypad calculator supporting mathematical expressions (`+`, `-`, `*`, `/`).
  - Note field and instant dispatch saving.

- **Ledger / Details**:
  - Comprehensive list of past transactions with category avatars.
  - Live search by note, category, or date.
  - Filter pills for All, Expense, and Income.
  - In-place edit and delete dialogs.

- **Multi-User Account Management**:
  - Isolated financial sheets per user.
  - Default Admin account (`abujar287` / `hisabkitab`).
  - Create members, toggle active/inactive status, and switch between profiles.

- **Settings & Cloud Sync**:
  - Bilingual support with on-the-fly switching between **English** and **বাংলা (Bengali)** with Bengali digit localization (`০-৯`).
  - Add and delete custom expense/income categories.
  - Real-time and manual sync with Google Sheets (via Google Apps Script Web App).
  - Profile modification and logout.

## Architecture

- **Language**: Kotlin 2.1
- **UI Framework**: Jetpack Compose with Material 3 (Dark/Fintech Slate palette)
- **Architecture**: MVVM with `StateFlow` and Coroutines
- **Storage**: Local SharedPreferences with JSON serialization + OkHttp cloud sync
- **Icons**: Custom adaptive vector launcher icon with mipmap fallbacks
