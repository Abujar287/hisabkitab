package com.abujar.hisabkitab.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Wallet
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.abujar.hisabkitab.R
import com.abujar.hisabkitab.model.AppLanguage
import com.abujar.hisabkitab.model.DaySummary
import com.abujar.hisabkitab.model.SummaryScope
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
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

@Composable
fun SummaryScreen(
    viewModel: HisabViewModel,
    modifier: Modifier = Modifier
) {
    val language by viewModel.language.collectAsState()
    val scope by viewModel.summaryScope.collectAsState()
    val selectedMonth by viewModel.selectedMonth.collectAsState()
    val transactions by viewModel.transactions.collectAsState()

    val filteredTxs = remember(transactions, selectedMonth, scope) {
        viewModel.getFilteredTransactions()
    }

    val totalIncome = remember(filteredTxs) {
        filteredTxs.filter { it.type == TransactionType.Income }.sumOf { it.value }
    }
    val totalExpense = remember(filteredTxs) {
        filteredTxs.filter { it.type == TransactionType.Expense }.sumOf { it.value }
    }
    val netBalance = totalIncome - totalExpense

    val dailySummaries = remember(transactions, selectedMonth) {
        viewModel.getDaySummariesForSelectedMonth()
    }

    // Category breakdown
    val categoryTotals = remember(filteredTxs) {
        filteredTxs.filter { it.type == TransactionType.Expense }
            .groupBy { it.category }
            .mapValues { entry -> entry.value.sumOf { it.value } }
            .toList()
            .sortedByDescending { it.second }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Slate900)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            // Hero Banner
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Slate800),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp)
            ) {
                Box {
                    Image(
                        painter = painterResource(id = R.drawable.img_hero_finance),
                        contentDescription = "Finance Hero",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(130.dp)
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .background(Color.Black.copy(alpha = 0.45f))
                    )
                    Column(
                        modifier = Modifier
                            .padding(14.dp)
                            .align(Alignment.BottomStart)
                    ) {
                        Text(
                            text = if (language == AppLanguage.EN) "Smart Personal Finance" else "স্মার্ট হিসাব-নিকাশ",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = if (language == AppLanguage.EN)
                                "Real-time ledger & monthly planning"
                            else
                                "দৈনন্দিন আয়-ব্যয়ের নিখুঁত হিসাব",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate400,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        // Scope Switch (Month vs All-time) & Month Navigator
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Scope selector
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Slate800)
                        .padding(3.dp)
                ) {
                    val isMonth = scope == SummaryScope.MONTH
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = if (isMonth) Sky500 else Color.Transparent,
                        modifier = Modifier
                            .testTag("scope_month_button")
                            .clickable { viewModel.setSummaryScope(SummaryScope.MONTH) }
                    ) {
                        Text(
                            text = if (language == AppLanguage.EN) "Month" else "মাসিক",
                            color = if (isMonth) Slate900 else Slate400,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = if (!isMonth) Sky500 else Color.Transparent,
                        modifier = Modifier
                            .testTag("scope_all_button")
                            .clickable { viewModel.setSummaryScope(SummaryScope.ALL) }
                    ) {
                        Text(
                            text = if (language == AppLanguage.EN) "All Time" else "সর্বমোট",
                            color = if (!isMonth) Slate900 else Slate400,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }
                }

                // Month Navigator
                if (scope == SummaryScope.MONTH) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(
                            onClick = {
                                val cal = Calendar.getInstance()
                                try {
                                    val parts = selectedMonth.split("-")
                                    cal.set(parts[0].toInt(), parts[1].toInt() - 2, 1)
                                    viewModel.setSelectedMonth(SimpleDateFormat("yyyy-MM", Locale.US).format(cal.time))
                                } catch (_: Exception) {}
                            },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Prev", tint = Slate400, modifier = Modifier.size(16.dp))
                        }

                        Text(
                            text = selectedMonth,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(horizontal = 4.dp)
                        )

                        IconButton(
                            onClick = {
                                val cal = Calendar.getInstance()
                                try {
                                    val parts = selectedMonth.split("-")
                                    cal.set(parts[0].toInt(), parts[1].toInt(), 1)
                                    viewModel.setSelectedMonth(SimpleDateFormat("yyyy-MM", Locale.US).format(cal.time))
                                } catch (_: Exception) {}
                            },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(Icons.Default.ArrowForward, contentDescription = "Next", tint = Slate400, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }

        // Summary Metric Cards
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                // Balance Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = Slate800),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().testTag("net_balance_card")
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = if (language == AppLanguage.EN) "Net Balance" else "অবশিষ্ট ব্যালেন্স",
                                color = Slate400,
                                fontSize = 13.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = FormatUtils.formatCurrency(netBalance, language),
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (netBalance >= 0) Emerald500 else Rose500
                            )
                        }
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(if (netBalance >= 0) Emerald500.copy(alpha = 0.2f) else Rose500.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Wallet,
                                contentDescription = "Balance",
                                tint = if (netBalance >= 0) Emerald500 else Rose500
                            )
                        }
                    }
                }

                // Income & Expense 2-column cards
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Income
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Slate800),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.weight(1f).testTag("total_income_card")
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.TrendingUp,
                                    contentDescription = "Income",
                                    tint = Emerald500,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = if (language == AppLanguage.EN) "Total Income" else "মোট আয়",
                                    fontSize = 12.sp,
                                    color = Slate400
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "+${FormatUtils.formatCurrency(totalIncome, language)}",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Emerald500
                            )
                        }
                    }

                    // Expense
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Slate800),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.weight(1f).testTag("total_expense_card")
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.TrendingDown,
                                    contentDescription = "Expense",
                                    tint = Rose500,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = if (language == AppLanguage.EN) "Total Expense" else "মোট খরচ",
                                    fontSize = 12.sp,
                                    color = Slate400
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "-${FormatUtils.formatCurrency(totalExpense, language)}",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Rose500
                            )
                        }
                    }
                }
            }
        }

        // Calendar Day Breakdown Section
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (language == AppLanguage.EN) "Day-by-Day Ledger" else "দৈনিক খরচের ক্যালেন্ডার",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = if (language == AppLanguage.EN) "Tap day for details" else "দিনের ওপর চাপুন",
                        fontSize = 11.sp,
                        color = Slate400
                    )
                }

                Card(
                    colors = CardDefaults.cardColors(containerColor = Slate800),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        // Calendar grid for 31 days (7 columns)
                        val days = dailySummaries
                        val rows = (days.size + 6) / 7
                        for (r in 0 until rows) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 3.dp),
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                for (c in 0 until 7) {
                                    val index = r * 7 + c
                                    if (index < days.size) {
                                        val day = days[index]
                                        DayCell(
                                            day = day,
                                            language = language,
                                            onClick = { viewModel.openDayDetails(day.dateStr) },
                                            modifier = Modifier.weight(1f)
                                        )
                                    } else {
                                        Spacer(modifier = Modifier.weight(1f))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Category Breakdown Section
        item {
            Column(
                modifier = Modifier.padding(bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = if (language == AppLanguage.EN) "Expense by Category" else "খাতভিত্তিক খরচের বিশ্লেষণ",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                if (categoryTotals.isEmpty()) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Slate800),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (language == AppLanguage.EN) "No expense records yet" else "এখনো কোনো খরচের হিসাব নেই",
                                color = Slate400,
                                fontSize = 13.sp
                            )
                        }
                    }
                } else {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Slate800),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            categoryTotals.forEach { (cat, amount) ->
                                val pct = if (totalExpense > 0) (amount / totalExpense) else 0.0
                                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                FormatUtils.getCategoryEmoji(cat),
                                                fontSize = 14.sp
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text(
                                                text = cat,
                                                color = Color.White,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Medium
                                            )
                                        }
                                        Text(
                                            text = "${FormatUtils.formatCurrency(amount, language)} (${(pct * 100).toInt()}%)",
                                            color = Slate400,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    LinearProgressIndicator(
                                        progress = { pct.toFloat().coerceIn(0f, 1f) },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(6.dp)
                                            .clip(RoundedCornerShape(3.dp)),
                                        color = Sky500,
                                        trackColor = Slate700
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

@Composable
fun DayCell(
    day: DaySummary,
    language: AppLanguage,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val hasExp = day.exp > 0
    val hasInc = day.inc > 0
    val cellColor = when {
        hasExp && hasInc -> Sky500.copy(alpha = 0.2f)
        hasExp -> Rose500.copy(alpha = 0.2f)
        hasInc -> Emerald500.copy(alpha = 0.2f)
        else -> Slate900.copy(alpha = 0.6f)
    }

    Surface(
        shape = RoundedCornerShape(6.dp),
        color = cellColor,
        border = if (day.hasActivity) androidx.compose.foundation.BorderStroke(1.dp, Slate700) else null,
        modifier = modifier
            .aspectRatio(0.9f)
            .clickable { onClick() }
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(2.dp)
        ) {
            Text(
                text = FormatUtils.formatDay(day.day, language),
                fontSize = 11.sp,
                fontWeight = if (day.hasActivity) FontWeight.Bold else FontWeight.Normal,
                color = if (day.hasActivity) Color.White else Slate400
            )
            if (day.hasActivity) {
                Box(
                    modifier = Modifier
                        .size(4.dp)
                        .clip(CircleShape)
                        .background(if (day.net >= 0) Emerald500 else Rose500)
                )
            }
        }
    }
}
