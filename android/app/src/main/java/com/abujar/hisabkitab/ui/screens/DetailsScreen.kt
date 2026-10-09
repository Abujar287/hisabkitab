package com.abujar.hisabkitab.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
fun DetailsScreen(
    viewModel: HisabViewModel,
    modifier: Modifier = Modifier
) {
    val language by viewModel.language.collectAsState()
    val transactions by viewModel.transactions.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val typeFilter by viewModel.detailsTypeFilter.collectAsState()

    val filteredList = remember(transactions, searchQuery, typeFilter) {
        transactions.filter { tx ->
            val matchesType = typeFilter == null || tx.type == typeFilter
            val matchesQuery = searchQuery.isBlank() ||
                    tx.category.contains(searchQuery, ignoreCase = true) ||
                    tx.note.contains(searchQuery, ignoreCase = true) ||
                    tx.date.contains(searchQuery, ignoreCase = true)
            matchesType && matchesQuery
        }
    }

    val totalAmount = remember(filteredList) {
        val inc = filteredList.filter { it.type == TransactionType.Income }.sumOf { it.value }
        val exp = filteredList.filter { it.type == TransactionType.Expense }.sumOf { it.value }
        inc - exp
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Slate900)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { viewModel.setSearchQuery(it) },
            placeholder = { Text(if (language == AppLanguage.EN) "Search transactions, notes..." else "লেনদেন বা নোট খুঁজুন...", fontSize = 13.sp) },
            leadingIcon = {
                Icon(Icons.Default.Search, contentDescription = "Search", tint = Slate400, modifier = Modifier.size(18.dp))
            },
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = Sky500,
                unfocusedBorderColor = Slate700
            ),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().testTag("details_search_input")
        )

        // Filter Pills: All, Expense, Income
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val allSelected = typeFilter == null
            val expSelected = typeFilter == TransactionType.Expense
            val incSelected = typeFilter == TransactionType.Income

            Surface(
                shape = RoundedCornerShape(16.dp),
                color = if (allSelected) Sky500 else Slate800,
                modifier = Modifier
                    .testTag("filter_all_button")
                    .clickable { viewModel.setDetailsTypeFilter(null) }
            ) {
                Text(
                    text = if (language == AppLanguage.EN) "All" else "সব",
                    color = if (allSelected) Slate900 else Slate400,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                )
            }

            Surface(
                shape = RoundedCornerShape(16.dp),
                color = if (expSelected) Rose500 else Slate800,
                modifier = Modifier
                    .testTag("filter_expense_button")
                    .clickable { viewModel.setDetailsTypeFilter(TransactionType.Expense) }
            ) {
                Text(
                    text = if (language == AppLanguage.EN) "Expense" else "খরচ",
                    color = if (expSelected) Color.White else Slate400,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                )
            }

            Surface(
                shape = RoundedCornerShape(16.dp),
                color = if (incSelected) Emerald500 else Slate800,
                modifier = Modifier
                    .testTag("filter_income_button")
                    .clickable { viewModel.setDetailsTypeFilter(TransactionType.Income) }
            ) {
                Text(
                    text = if (language == AppLanguage.EN) "Income" else "আয়",
                    color = if (incSelected) Slate900 else Slate400,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            // Count badge
            Text(
                text = "${filteredList.size} ${if (language == AppLanguage.EN) "records" else "টি"}",
                color = Slate400,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.align(Alignment.CenterVertically)
            )
        }

        // Ledger List
        if (filteredList.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = if (language == AppLanguage.EN) "No transactions match your search" else "কোনো লেনদেন পাওয়া যায়নি",
                        color = Slate400,
                        fontSize = 14.sp
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredList, key = { it.id }) { tx ->
                    val isIncome = tx.type == TransactionType.Income
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Slate800),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("tx_card_${tx.id}")
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Category Icon / Emoji
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(if (isIncome) Emerald500.copy(alpha = 0.15f) else Rose500.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    FormatUtils.getCategoryEmoji(tx.category),
                                    fontSize = 20.sp
                                )
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            // Details
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = tx.category,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    fontSize = 14.sp
                                )
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = tx.date,
                                        color = Slate400,
                                        fontSize = 11.sp
                                    )
                                    if (tx.note.isNotBlank()) {
                                        Text(text = " • ", color = Slate400, fontSize = 11.sp)
                                        Text(
                                            text = tx.note,
                                            color = Sky500,
                                            fontSize = 11.sp,
                                            maxLines = 1
                                        )
                                    }
                                }
                            }

                            // Amount & Actions
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = "${if (isIncome) "+" else "-"}${FormatUtils.formatCurrency(tx.value, language)}",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isIncome) Emerald500 else Rose500
                                )

                                Row {
                                    IconButton(
                                        onClick = { viewModel.setEditingTx(tx) },
                                        modifier = Modifier.size(28.dp).testTag("edit_tx_${tx.id}")
                                    ) {
                                        Icon(
                                            Icons.Default.Edit,
                                            contentDescription = "Edit",
                                            tint = Sky500,
                                            modifier = Modifier.size(15.dp)
                                        )
                                    }
                                    IconButton(
                                        onClick = { viewModel.setDeletingTx(tx) },
                                        modifier = Modifier.size(28.dp).testTag("delete_tx_${tx.id}")
                                    ) {
                                        Icon(
                                            Icons.Default.Delete,
                                            contentDescription = "Delete",
                                            tint = Rose500,
                                            modifier = Modifier.size(15.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
