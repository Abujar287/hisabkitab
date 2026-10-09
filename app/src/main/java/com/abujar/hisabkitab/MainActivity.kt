package com.abujar.hisabkitab

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.abujar.hisabkitab.model.TransactionType
import com.abujar.hisabkitab.ui.components.AddCategoryDialog
import com.abujar.hisabkitab.ui.components.AddUserDialog
import com.abujar.hisabkitab.ui.components.DayDetailsDialog
import com.abujar.hisabkitab.ui.components.DeleteConfirmDialog
import com.abujar.hisabkitab.ui.components.EditProfileDialog
import com.abujar.hisabkitab.ui.components.EditTransactionDialog
import com.abujar.hisabkitab.ui.components.HisabBottomNavigation
import com.abujar.hisabkitab.ui.components.HisabHeader
import com.abujar.hisabkitab.ui.screens.DetailsScreen
import com.abujar.hisabkitab.ui.screens.EntryScreen
import com.abujar.hisabkitab.ui.screens.LoginScreen
import com.abujar.hisabkitab.ui.screens.SettingsScreen
import com.abujar.hisabkitab.ui.screens.SummaryScreen
import com.abujar.hisabkitab.ui.theme.HisabKitabTheme
import com.abujar.hisabkitab.ui.theme.Slate900
import com.abujar.hisabkitab.ui.viewmodel.HisabViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: HisabViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            HisabKitabTheme {
                MainAppContent(viewModel = viewModel)
            }
        }
    }
}

@Composable
fun MainAppContent(viewModel: HisabViewModel) {
    val context = LocalContext.current
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val activeTab by viewModel.activeTab.collectAsState()
    val language by viewModel.language.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()
    val isSyncing by viewModel.isSyncing.collectAsState()
    val lastSyncTime by viewModel.lastSyncTime.collectAsState()
    val toastMessage by viewModel.toastMessage.collectAsState()

    // Modals state
    val selectedDayDate by viewModel.selectedDayDate.collectAsState()
    val editingTx by viewModel.editingTransaction.collectAsState()
    val deletingTx by viewModel.deletingTransaction.collectAsState()
    val showAddUser by viewModel.showAddUserModal.collectAsState()
    val showAddCategory by viewModel.showAddCategoryModal.collectAsState()
    val categoryModalType by viewModel.categoryModalType.collectAsState()
    val showEditProfile by viewModel.showEditProfileModal.collectAsState()
    val transactions by viewModel.transactions.collectAsState()
    val expenseCategories by viewModel.expenseCategories.collectAsState()
    val incomeCategories by viewModel.incomeCategories.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }

    // Toast notification observer
    LaunchedEffect(toastMessage) {
        toastMessage?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            viewModel.clearToast()
        }
    }

    if (!isAuthenticated) {
        LoginScreen(viewModel = viewModel)
    } else {
        // Handle Back button to return to Summary tab if on other tabs
        if (activeTab != 0) {
            BackHandler {
                viewModel.setActiveTab(0)
            }
        }

        Scaffold(
            topBar = {
                HisabHeader(
                    currentUser = currentUser,
                    language = language,
                    isSyncing = isSyncing,
                    lastSyncTime = lastSyncTime,
                    onToggleLanguage = { viewModel.toggleLanguage() },
                    onManualSync = { viewModel.manualSync() },
                    onProfileClick = { viewModel.setActiveTab(4) }
                )
            },
            bottomBar = {
                HisabBottomNavigation(
                    selectedTab = activeTab,
                    language = language,
                    onTabSelected = { viewModel.setActiveTab(it) }
                )
            },
            containerColor = Slate900
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(Slate900)
            ) {
                when (activeTab) {
                    0 -> SummaryScreen(viewModel = viewModel)
                    1 -> EntryScreen(viewModel = viewModel)
                    2 -> DetailsScreen(viewModel = viewModel)
                    3 -> UsersScreen(viewModel = viewModel)
                    4 -> SettingsScreen(viewModel = viewModel)
                }
            }
        }

        // Dialogs
        selectedDayDate?.let { dateStr ->
            DayDetailsDialog(
                dateStr = dateStr,
                transactions = transactions,
                language = language,
                onDismiss = { viewModel.closeDayDetails() },
                onEdit = { viewModel.setEditingTx(it) },
                onDelete = { viewModel.setDeletingTx(it) },
                onAddForDate = { date ->
                    viewModel.setEntryDate(date)
                    viewModel.setActiveTab(1)
                }
            )
        }

        editingTx?.let { tx ->
            val cats = if (tx.type == TransactionType.Expense) expenseCategories else incomeCategories
            EditTransactionDialog(
                transaction = tx,
                categories = cats,
                language = language,
                onDismiss = { viewModel.setEditingTx(null) },
                onSave = { viewModel.updateTransaction(it) }
            )
        }

        deletingTx?.let { tx ->
            DeleteConfirmDialog(
                transaction = tx,
                language = language,
                onDismiss = { viewModel.setDeletingTx(null) },
                onConfirm = { viewModel.deleteTransaction(tx) }
            )
        }

        if (showAddUser) {
            AddUserDialog(
                language = language,
                onDismiss = { viewModel.setShowAddUserModal(false) },
                onConfirm = { name, uname, pass, role ->
                    viewModel.createUser(name, uname, pass, role)
                }
            )
        }

        if (showAddCategory) {
            AddCategoryDialog(
                type = categoryModalType,
                language = language,
                onDismiss = { viewModel.setShowAddCategoryModal(false) },
                onConfirm = { name ->
                    viewModel.addCategory(name, categoryModalType)
                }
            )
        }

        if (showEditProfile) {
            EditProfileDialog(
                currentName = currentUser?.displayName ?: "",
                language = language,
                onDismiss = { viewModel.setShowEditProfileModal(false) },
                onConfirm = { name, pass ->
                    viewModel.updateProfile(name, pass)
                }
            )
        }
    }
}
