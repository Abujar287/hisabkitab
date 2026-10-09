package com.abujar.hisabkitab.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.abujar.hisabkitab.data.Constants
import com.abujar.hisabkitab.model.AppLanguage
import com.abujar.hisabkitab.model.TransactionType
import com.abujar.hisabkitab.ui.theme.Emerald500
import com.abujar.hisabkitab.ui.theme.Rose500
import com.abujar.hisabkitab.ui.theme.Sky500
import com.abujar.hisabkitab.ui.theme.Slate400
import com.abujar.hisabkitab.ui.theme.Slate700
import com.abujar.hisabkitab.ui.theme.Slate800
import com.abujar.hisabkitab.ui.theme.Slate900
import com.abujar.hisabkitab.ui.viewmodel.HisabViewModel
import com.abujar.hisabkitab.utils.FormatUtils

@Composable
fun SettingsScreen(
    viewModel: HisabViewModel,
    modifier: Modifier = Modifier
) {
    val language by viewModel.language.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()
    val isSyncing by viewModel.isSyncing.collectAsState()
    val lastSyncTime by viewModel.lastSyncTime.collectAsState()
    val expenseCategories by viewModel.expenseCategories.collectAsState()
    val incomeCategories by viewModel.incomeCategories.collectAsState()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Slate900)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = if (language == AppLanguage.EN) "Settings & Preferences" else "সেটিংস ও পছন্দসমূহ",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        // Language Section
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate800),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Language, contentDescription = "Lang", tint = Sky500, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (language == AppLanguage.EN) "Language / ভাষা" else "ভাষা / Language",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 14.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        val isEn = language == AppLanguage.EN
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = if (isEn) Sky500 else Slate700,
                            modifier = Modifier
                                .weight(1f)
                                .clickable { if (!isEn) viewModel.toggleLanguage() }
                        ) {
                            Box(modifier = Modifier.padding(10.dp), contentAlignment = Alignment.Center) {
                                Text(
                                    "English",
                                    color = if (isEn) Slate900 else Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            }
                        }

                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = if (!isEn) Sky500 else Slate700,
                            modifier = Modifier
                                .weight(1f)
                                .clickable { if (isEn) viewModel.toggleLanguage() }
                        ) {
                            Box(modifier = Modifier.padding(10.dp), contentAlignment = Alignment.Center) {
                                Text(
                                    "বাংলা (Bengali)",
                                    color = if (!isEn) Slate900 else Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }
                }
            }
        }

        // Cloud Sync Section
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate800),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CloudDone, contentDescription = "Cloud", tint = Emerald500, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (language == AppLanguage.EN) "Google Sheets Cloud Sync" else "গুগল শিট ক্লাউড সিঙ্ক",
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                fontSize = 14.sp
                            )
                        }

                        Button(
                            onClick = { viewModel.manualSync() },
                            enabled = !isSyncing,
                            colors = ButtonDefaults.buttonColors(containerColor = Sky500),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.testTag("sync_now_button")
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = "Sync", tint = Slate900, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (language == AppLanguage.EN) "Sync Now" else "সিঙ্ক",
                                color = Slate900,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "${if (language == AppLanguage.EN) "Active Sheet Tab: " else "অ্যাক্টিভ শিট ট্যাব: "} ${currentUser?.sheetTab ?: "abujar287"}",
                        color = Slate400,
                        fontSize = 12.sp
                    )
                    Text(
                        text = "${if (language == AppLanguage.EN) "Last synced: " else "সর্বশেষ সিঙ্ক: "} $lastSyncTime",
                        color = Emerald500,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        // Category Management Section
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate800),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = if (language == AppLanguage.EN) "Expense Categories" else "খরচের ক্যাটাগরিসমূহ",
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 14.sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    expenseCategories.forEach { cat ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(FormatUtils.getCategoryEmoji(cat), fontSize = 14.sp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(cat, color = Color.White, fontSize = 13.sp)
                            }
                            IconButton(
                                onClick = { viewModel.deleteCategory(cat, TransactionType.Expense) },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Rose500, modifier = Modifier.size(14.dp))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Button(
                        onClick = { viewModel.setShowAddCategoryModal(true, TransactionType.Expense) },
                        colors = ButtonDefaults.buttonColors(containerColor = Slate700),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth().testTag("add_expense_category_btn")
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add", tint = Sky500, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(if (language == AppLanguage.EN) "+ Add Expense Category" else "+ নতুন খরচের খাত", color = Color.White, fontSize = 12.sp)
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = if (language == AppLanguage.EN) "Income Categories" else "আয়ের ক্যাটাগরিসমূহ",
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 14.sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    incomeCategories.forEach { cat ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(FormatUtils.getCategoryEmoji(cat), fontSize = 14.sp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(cat, color = Color.White, fontSize = 13.sp)
                            }
                            IconButton(
                                onClick = { viewModel.deleteCategory(cat, TransactionType.Income) },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Rose500, modifier = Modifier.size(14.dp))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Button(
                        onClick = { viewModel.setShowAddCategoryModal(true, TransactionType.Income) },
                        colors = ButtonDefaults.buttonColors(containerColor = Slate700),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth().testTag("add_income_category_btn")
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add", tint = Emerald500, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(if (language == AppLanguage.EN) "+ Add Income Category" else "+ নতুন আয়ের খাত", color = Color.White, fontSize = 12.sp)
                    }
                }
            }
        }

        // Account & Profile Section
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate800),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = if (language == AppLanguage.EN) "Account" else "অ্যাকাউন্ট",
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 14.sp
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = currentUser?.displayName ?: "User",
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                fontSize = 14.sp
                            )
                            Text(
                                text = "@${currentUser?.username}",
                                color = Slate400,
                                fontSize = 12.sp
                            )
                        }

                        Button(
                            onClick = { viewModel.setShowEditProfileModal(true) },
                            colors = ButtonDefaults.buttonColors(containerColor = Slate700),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit", tint = Sky500, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(if (language == AppLanguage.EN) "Edit" else "পরিবর্তন", color = Color.White, fontSize = 12.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Logout Button
                    Button(
                        onClick = { viewModel.logout() },
                        colors = ButtonDefaults.buttonColors(containerColor = Rose500.copy(alpha = 0.2f)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth().testTag("logout_button")
                    ) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout", tint = Rose500, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (language == AppLanguage.EN) "Sign Out" else "লগআউট",
                            color = Rose500,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
