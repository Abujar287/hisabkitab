package com.abujar.hisabkitab.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.abujar.hisabkitab.data.Constants
import com.abujar.hisabkitab.data.HisabRepository
import com.abujar.hisabkitab.model.AppLanguage
import com.abujar.hisabkitab.model.AppUser
import com.abujar.hisabkitab.model.DaySummary
import com.abujar.hisabkitab.model.SummaryScope
import com.abujar.hisabkitab.model.Transaction
import com.abujar.hisabkitab.model.TransactionType
import com.abujar.hisabkitab.utils.FormatUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class HisabViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = HisabRepository(application)

    // Language
    private val _language = MutableStateFlow(repository.getLanguage())
    val language: StateFlow<AppLanguage> = _language.asStateFlow()

    // Authentication
    private val _users = MutableStateFlow(repository.getUsers())
    val users: StateFlow<List<AppUser>> = _users.asStateFlow()

    private val _currentUser = MutableStateFlow<AppUser?>(repository.getActiveUser())
    val currentUser: StateFlow<AppUser?> = _currentUser.asStateFlow()

    private val _isAuthenticated = MutableStateFlow(_currentUser.value != null)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    // Navigation Tab (0: Summary, 1: Entry, 2: Details, 3: Users, 4: Settings)
    private val _activeTab = MutableStateFlow(0)
    val activeTab: StateFlow<Int> = _activeTab.asStateFlow()

    // Summary Scope & Month
    private val _summaryScope = MutableStateFlow(SummaryScope.MONTH)
    val summaryScope: StateFlow<SummaryScope> = _summaryScope.asStateFlow()

    private val sdfMonth = SimpleDateFormat("yyyy-MM", Locale.US)
    private val _selectedMonth = MutableStateFlow(sdfMonth.format(Date()))
    val selectedMonth: StateFlow<String> = _selectedMonth.asStateFlow()

    // Data per current user tab
    private val currentTab: String
        get() = _currentUser.value?.sheetTab?.ifBlank { _currentUser.value?.username } ?: "abujar287"

    private val _transactions = MutableStateFlow<List<Transaction>>(emptyList())
    val transactions: StateFlow<List<Transaction>> = _transactions.asStateFlow()

    private val _expenseCategories = MutableStateFlow<List<String>>(Constants.DEFAULT_EXPENSE_CATEGORIES)
    val expenseCategories: StateFlow<List<String>> = _expenseCategories.asStateFlow()

    private val _incomeCategories = MutableStateFlow<List<String>>(Constants.DEFAULT_INCOME_CATEGORIES)
    val incomeCategories: StateFlow<List<String>> = _incomeCategories.asStateFlow()

    // Sync state
    private val _isSyncing = MutableStateFlow(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing.asStateFlow()

    private val _lastSyncTime = MutableStateFlow(FormatUtils.formatSyncDate(Date(), _language.value))
    val lastSyncTime: StateFlow<String> = _lastSyncTime.asStateFlow()

    // Toast message
    private val _toastMessage = MutableStateFlow<String?>(null)
    val toastMessage: StateFlow<String?> = _toastMessage.asStateFlow()

    // Entry state
    private val _entryType = MutableStateFlow(TransactionType.Expense)
    val entryType: StateFlow<TransactionType> = _entryType.asStateFlow()

    private val _entryCategory = MutableStateFlow(Constants.DEFAULT_EXPENSE_CATEGORIES[0])
    val entryCategory: StateFlow<String> = _entryCategory.asStateFlow()

    private val sdfDate = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private val _entryDate = MutableStateFlow(sdfDate.format(Date()))
    val entryDate: StateFlow<String> = _entryDate.asStateFlow()

    private val _entryNote = MutableStateFlow("")
    val entryNote: StateFlow<String> = _entryNote.asStateFlow()

    private val _calcDisplay = MutableStateFlow("0")
    val calcDisplay: StateFlow<String> = _calcDisplay.asStateFlow()

    // Dialogs / Modals
    private val _selectedDayDate = MutableStateFlow<String?>(null)
    val selectedDayDate: StateFlow<String?> = _selectedDayDate.asStateFlow()

    private val _editingTransaction = MutableStateFlow<Transaction?>(null)
    val editingTransaction: StateFlow<Transaction?> = _editingTransaction.asStateFlow()

    private val _deletingTransaction = MutableStateFlow<Transaction?>(null)
    val deletingTransaction: StateFlow<Transaction?> = _deletingTransaction.asStateFlow()

    private val _showAddUserModal = MutableStateFlow(false)
    val showAddUserModal: StateFlow<Boolean> = _showAddUserModal.asStateFlow()

    private val _showAddCategoryModal = MutableStateFlow(false)
    val showAddCategoryModal: StateFlow<Boolean> = _showAddCategoryModal.asStateFlow()

    private val _categoryModalType = MutableStateFlow(TransactionType.Expense)
    val categoryModalType: StateFlow<TransactionType> = _categoryModalType.asStateFlow()

    private val _showEditProfileModal = MutableStateFlow(false)
    val showEditProfileModal: StateFlow<Boolean> = _showEditProfileModal.asStateFlow()

    // Search & Filter in Details tab
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _detailsTypeFilter = MutableStateFlow<TransactionType?>(null)
    val detailsTypeFilter: StateFlow<TransactionType?> = _detailsTypeFilter.asStateFlow()

    private val _detailsCategoryFilter = MutableStateFlow<String?>(null)
    val detailsCategoryFilter: StateFlow<String?> = _detailsCategoryFilter.asStateFlow()

    init {
        loadUserData()
        if (_isAuthenticated.value) {
            manualSync()
        }
    }

    private fun loadUserData() {
        val tab = currentTab
        _transactions.value = repository.getTransactions(tab)
        _expenseCategories.value = repository.getExpenseCategories(tab)
        _incomeCategories.value = repository.getIncomeCategories(tab)
        _entryCategory.value = _expenseCategories.value.firstOrNull() ?: "Others"
    }

    fun showToast(msg: String) {
        _toastMessage.value = msg
    }

    fun clearToast() {
        _toastMessage.value = null
    }

    fun toggleLanguage() {
        val next = if (_language.value == AppLanguage.EN) AppLanguage.BN else AppLanguage.EN
        _language.value = next
        repository.setLanguage(next)
        _lastSyncTime.value = FormatUtils.formatSyncDate(Date(), next)
        showToast(if (next == AppLanguage.EN) "Switched to English" else "বাংলায় পরিবর্তিত হয়েছে")
    }

    fun setActiveTab(tabIndex: Int) {
        _activeTab.value = tabIndex
    }

    fun setSummaryScope(scope: SummaryScope) {
        _summaryScope.value = scope
    }

    fun setSelectedMonth(month: String) {
        _selectedMonth.value = month
    }

    fun setSearchQuery(q: String) {
        _searchQuery.value = q
    }

    fun setDetailsTypeFilter(type: TransactionType?) {
        _detailsTypeFilter.value = type
    }

    fun setDetailsCategoryFilter(cat: String?) {
        _detailsCategoryFilter.value = cat
    }

    fun setEntryType(type: TransactionType) {
        _entryType.value = type
        val cats = if (type == TransactionType.Expense) _expenseCategories.value else _incomeCategories.value
        if (!_entryCategory.value.let { cats.contains(it) }) {
            _entryCategory.value = cats.firstOrNull() ?: "Others"
        }
    }

    fun setEntryCategory(cat: String) {
        _entryCategory.value = cat
    }

    fun setEntryDate(date: String) {
        _entryDate.value = date
    }

    fun setEntryNote(note: String) {
        _entryNote.value = note
    }

    // Calculator input handler
    fun onCalcKey(key: String) {
        val cur = _calcDisplay.value
        when (key) {
            "C" -> _calcDisplay.value = "0"
            "DEL" -> {
                if (cur.length > 1) {
                    _calcDisplay.value = cur.dropLast(1)
                } else {
                    _calcDisplay.value = "0"
                }
            }
            "=" -> {
                try {
                    val result = evaluateSimpleExpression(cur)
                    _calcDisplay.value = if (result % 1.0 == 0.0) result.toLong().toString() else result.toString()
                } catch (_: Exception) {}
            }
            "+", "-", "*", "/" -> {
                if (cur.isNotEmpty() && !cur.last().isWhitespace() && cur.last() !in "+-*/") {
                    _calcDisplay.value = "$cur $key "
                }
            }
            "." -> {
                val tokens = cur.split(" ")
                val lastToken = tokens.lastOrNull() ?: ""
                if (!lastToken.contains(".")) {
                    _calcDisplay.value = if (lastToken.isEmpty()) "${cur}0." else "$cur."
                }
            }
            else -> {
                if (cur == "0") {
                    _calcDisplay.value = key
                } else {
                    _calcDisplay.value = cur + key
                }
            }
        }
    }

    private fun evaluateSimpleExpression(expr: String): Double {
        val clean = expr.trim()
        val tokens = clean.split("\\s+".toRegex()).filter { it.isNotBlank() }
        if (tokens.isEmpty()) return 0.0
        if (tokens.size == 1) return tokens[0].toDoubleOrNull() ?: 0.0

        var result = tokens[0].toDoubleOrNull() ?: 0.0
        var i = 1
        while (i < tokens.size - 1) {
            val op = tokens[i]
            val nextVal = tokens[i + 1].toDoubleOrNull() ?: 0.0
            result = when (op) {
                "+" -> result + nextVal
                "-" -> result - nextVal
                "*" -> result * nextVal
                "/" -> if (nextVal != 0.0) result / nextVal else result
                else -> result
            }
            i += 2
        }
        return result
    }

    fun saveTransaction() {
        val amount = try {
            evaluateSimpleExpression(_calcDisplay.value)
        } catch (_: Exception) {
            0.0
        }
        if (amount <= 0) {
            showToast(if (_language.value == AppLanguage.EN) "Please enter a valid amount!" else "সঠিক টাকার পরিমাণ দিন!")
            return
        }

        val newTx = Transaction(
            id = "${System.currentTimeMillis()}_${(1000..9999).random()}",
            datetime = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.US).format(Date()),
            type = _entryType.value,
            category = _entryCategory.value,
            date = _entryDate.value,
            value = amount,
            note = _entryNote.value.trim()
        )

        val updated = listOf(newTx) + _transactions.value
        _transactions.value = updated
        repository.saveTransactions(currentTab, updated)

        // Sync to cloud asynchronously
        viewModelScope.launch {
            repository.postToCloud(
                mapOf(
                    "action" to "insert",
                    "sheetTab" to currentTab,
                    "id" to newTx.id,
                    "datetime" to newTx.datetime,
                    "type" to newTx.type.name,
                    "category" to newTx.category,
                    "date" to newTx.date,
                    "value" to newTx.value,
                    "note" to newTx.note
                )
            )
        }

        _calcDisplay.value = "0"
        _entryNote.value = ""
        showToast(if (_language.value == AppLanguage.EN) "Transaction saved & synced!" else "লেনদেনটি সফলভাবে সেভ হয়েছে!")
    }

    fun updateTransaction(updated: Transaction) {
        val list = _transactions.value.map { if (it.id == updated.id) updated else it }
        _transactions.value = list
        repository.saveTransactions(currentTab, list)

        viewModelScope.launch {
            repository.postToCloud(
                mapOf(
                    "action" to "update",
                    "sheetTab" to currentTab,
                    "id" to updated.id,
                    "datetime" to updated.datetime,
                    "type" to updated.type.name,
                    "category" to updated.category,
                    "date" to updated.date,
                    "value" to updated.value,
                    "note" to updated.note
                )
            )
        }
        _editingTransaction.value = null
        showToast(if (_language.value == AppLanguage.EN) "Transaction updated!" else "লেনদেন আপডেট হয়েছে!")
    }

    fun deleteTransaction(tx: Transaction) {
        val list = _transactions.value.filter { it.id != tx.id }
        _transactions.value = list
        repository.saveTransactions(currentTab, list)

        viewModelScope.launch {
            repository.postToCloud(
                mapOf(
                    "action" to "delete",
                    "sheetTab" to currentTab,
                    "id" to tx.id
                )
            )
        }
        _deletingTransaction.value = null
        showToast(if (_language.value == AppLanguage.EN) "Transaction deleted!" else "লেনদেন মুছে ফেলা হয়েছে!")
    }

    fun manualSync() {
        val tab = currentTab
        _isSyncing.value = true
        viewModelScope.launch {
            val cloudData = repository.fetchTransactionsFromCloud(tab)
            if (cloudData != null) {
                _transactions.value = cloudData
                repository.saveTransactions(tab, cloudData)
                _lastSyncTime.value = FormatUtils.formatSyncDate(Date(), _language.value)
                showToast(
                    if (_language.value == AppLanguage.EN)
                        "Synced ${cloudData.size} transactions from cloud!"
                    else
                        "ক্লাউড থেকে ${cloudData.size}টি লেনদেন সফলভাবে সিঙ্ক হয়েছে!"
                )
            } else {
                showToast(if (_language.value == AppLanguage.EN) "Cloud sync completed" else "ক্লাউড সিঙ্ক সম্পন্ন হয়েছে")
            }
            _isSyncing.value = false
        }
    }

    // Category Management
    fun addCategory(cat: String, type: TransactionType) {
        val trimmed = cat.trim()
        if (trimmed.isEmpty()) return
        if (type == TransactionType.Expense) {
            val list = _expenseCategories.value + trimmed
            _expenseCategories.value = list
            repository.saveExpenseCategories(currentTab, list)
        } else {
            val list = _incomeCategories.value + trimmed
            _incomeCategories.value = list
            repository.saveIncomeCategories(currentTab, list)
        }
        _showAddCategoryModal.value = false
        showToast(if (_language.value == AppLanguage.EN) "Category '$trimmed' added!" else "'$trimmed' ক্যাটাগরি যোগ হয়েছে!")
    }

    fun deleteCategory(cat: String, type: TransactionType) {
        if (type == TransactionType.Expense) {
            val list = _expenseCategories.value.filter { it != cat }
            _expenseCategories.value = list
            repository.saveExpenseCategories(currentTab, list)
        } else {
            val list = _incomeCategories.value.filter { it != cat }
            _incomeCategories.value = list
            repository.saveIncomeCategories(currentTab, list)
        }
        showToast(if (_language.value == AppLanguage.EN) "Category removed" else "ক্যাটাগরি মুছে ফেলা হয়েছে")
    }

    // User Management & Auth
    fun login(username: String, pass: String): Boolean {
        val target = _users.value.find {
            it.username.equals(username.trim(), ignoreCase = true) ||
            it.initialUsername.equals(username.trim(), ignoreCase = true)
        }
        if (target == null) {
            showToast(if (_language.value == AppLanguage.EN) "User not found!" else "ইউজার পাওয়া যায়নি!")
            return false
        }
        if (target.password != pass.trim()) {
            showToast(if (_language.value == AppLanguage.EN) "Incorrect password!" else "ভুল পাসওয়ার্ড!")
            return false
        }
        if (!target.isActive) {
            showToast(if (_language.value == AppLanguage.EN) "Account is deactivated!" else "অ্যাকাউন্ট নিষ্ক্রিয় রয়েছে!")
            return false
        }
        _currentUser.value = target
        _isAuthenticated.value = true
        repository.saveActiveUser(target)
        loadUserData()
        manualSync()
        return true
    }

    fun logout() {
        _isAuthenticated.value = false
        _currentUser.value = null
    }

    fun switchUser(user: AppUser) {
        if (!user.isActive) {
            showToast(if (_language.value == AppLanguage.EN) "Account is deactivated!" else "অ্যাকাউন্ট নিষ্ক্রিয় রয়েছে!")
            return
        }
        _currentUser.value = user
        repository.saveActiveUser(user)
        loadUserData()
        manualSync()
        showToast(if (_language.value == AppLanguage.EN) "Switched to ${user.displayName}" else "${user.displayName} অ্যাকাউন্টে সুইচ করা হয়েছে")
    }

    fun toggleUserActive(user: AppUser) {
        if (user.username == "abujar287") {
            showToast(if (_language.value == AppLanguage.EN) "Admin account cannot be deactivated!" else "মূল অ্যাডমিন নিষ্ক্রিয় করা যাবে না!")
            return
        }
        val updated = _users.value.map { if (it.username == user.username) it.copy(isActive = !it.isActive) else it }
        _users.value = updated
        repository.saveUsers(updated)
        showToast(if (_language.value == AppLanguage.EN) "User status updated" else "ইউজার স্ট্যাটাস পরিবর্তন হয়েছে")
    }

    fun createUser(name: String, uname: String, pass: String, role: String) {
        if (_users.value.any { it.username.equals(uname.trim(), ignoreCase = true) }) {
            showToast(if (_language.value == AppLanguage.EN) "Username already exists!" else "এই ইউজারনেম ইতিমধ্যে রয়েছে!")
            return
        }
        val newUser = AppUser(
            username = uname.trim(),
            password = pass.trim(),
            displayName = name.trim(),
            sheetTab = uname.trim(),
            createdAt = sdfDate.format(Date()),
            role = role,
            isActive = true
        )
        val list = _users.value + newUser
        _users.value = list
        repository.saveUsers(list)
        _showAddUserModal.value = false
        showToast(if (_language.value == AppLanguage.EN) "User @$uname created!" else "@$uname ইউজার সফলভাবে তৈরি হয়েছে!")
    }

    fun deleteUser(user: AppUser) {
        if (user.username == "abujar287") {
            showToast(if (_language.value == AppLanguage.EN) "Admin cannot be deleted!" else "অ্যাডমিন ডিলিট করা যাবে না!")
            return
        }
        val list = _users.value.filter { it.username != user.username }
        _users.value = list
        repository.saveUsers(list)
        if (_currentUser.value?.username == user.username) {
            val admin = list.find { it.username == "abujar287" } ?: Constants.DEFAULT_ADMIN
            switchUser(admin)
        }
        showToast(if (_language.value == AppLanguage.EN) "User deleted" else "ইউজার মুছে ফেলা হয়েছে")
    }

    fun updateProfile(displayName: String, pass: String) {
        val user = _currentUser.value ?: return
        val updated = user.copy(
            displayName = displayName.ifBlank { user.displayName },
            password = pass.ifBlank { user.password }
        )
        val userList = _users.value.map { if (it.username == user.username) updated else it }
        _users.value = userList
        _currentUser.value = updated
        repository.saveUsers(userList)
        repository.saveActiveUser(updated)
        _showEditProfileModal.value = false
        showToast(if (_language.value == AppLanguage.EN) "Profile updated!" else "প্রোফাইল আপডেট হয়েছে!")
    }

    // Modal controls
    fun openDayDetails(dateStr: String) { _selectedDayDate.value = dateStr }
    fun closeDayDetails() { _selectedDayDate.value = null }
    fun setEditingTx(tx: Transaction?) { _editingTransaction.value = tx }
    fun setDeletingTx(tx: Transaction?) { _deletingTransaction.value = tx }
    fun setShowAddUserModal(show: Boolean) { _showAddUserModal.value = show }
    fun setShowAddCategoryModal(show: Boolean, type: TransactionType = TransactionType.Expense) {
        _categoryModalType.value = type
        _showAddCategoryModal.value = show
    }
    fun setShowEditProfileModal(show: Boolean) { _showEditProfileModal.value = show }

    // Computations
    fun getFilteredTransactions(): List<Transaction> {
        val all = _transactions.value
        val month = _selectedMonth.value
        val scope = _summaryScope.value
        return if (scope == SummaryScope.MONTH) {
            all.filter { it.date.startsWith(month) }
        } else {
            all
        }
    }

    fun getDaySummariesForSelectedMonth(): List<DaySummary> {
        val monthStr = _selectedMonth.value
        val cal = Calendar.getInstance(Locale.US)
        try {
            val parts = monthStr.split("-")
            cal.set(Calendar.YEAR, parts[0].toInt())
            cal.set(Calendar.MONTH, parts[1].toInt() - 1)
        } catch (_: Exception) {}
        val maxDays = cal.getActualMaximum(Calendar.DAY_OF_MONTH)

        val monthTxs = _transactions.value.filter { it.date.startsWith(monthStr) }
        val daysList = mutableListOf<DaySummary>()
        val dayOfWeekFormat = SimpleDateFormat("EEE", Locale.US)

        for (day in 1..maxDays) {
            val dayStr = String.format(Locale.US, "%02d", day)
            val fullDateStr = "$monthStr-$dayStr"
            cal.set(Calendar.DAY_OF_MONTH, day)
            val dow = dayOfWeekFormat.format(cal.time)

            val txsForDay = monthTxs.filter { it.date == fullDateStr }
            val exp = txsForDay.filter { it.type == TransactionType.Expense }.sumOf { it.value }
            val inc = txsForDay.filter { it.type == TransactionType.Income }.sumOf { it.value }
            val net = inc - exp

            daysList.add(
                DaySummary(
                    day = day,
                    dateStr = fullDateStr,
                    dayOfWeek = dow,
                    exp = exp,
                    inc = inc,
                    net = net,
                    count = txsForDay.size,
                    hasActivity = txsForDay.isNotEmpty()
                )
            )
        }
        return daysList
    }
}
