package com.abujar.hisabkitab.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Backspace
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Note
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
fun EntryScreen(
    viewModel: HisabViewModel,
    modifier: Modifier = Modifier
) {
    val language by viewModel.language.collectAsState()
    val entryType by viewModel.entryType.collectAsState()
    val entryCategory by viewModel.entryCategory.collectAsState()
    val entryDate by viewModel.entryDate.collectAsState()
    val entryNote by viewModel.entryNote.collectAsState()
    val calcDisplay by viewModel.calcDisplay.collectAsState()
    val expenseCategories by viewModel.expenseCategories.collectAsState()
    val incomeCategories by viewModel.incomeCategories.collectAsState()

    val categories = if (entryType == TransactionType.Expense) expenseCategories else incomeCategories
    val isExpense = entryType == TransactionType.Expense

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Slate900)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Toggle Expense vs Income
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Slate800)
                .padding(4.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = if (isExpense) Rose500 else Color.Transparent,
                modifier = Modifier
                    .weight(1f)
                    .testTag("entry_type_expense_btn")
                    .clickable { viewModel.setEntryType(TransactionType.Expense) }
            ) {
                Box(
                    modifier = Modifier.padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (language == AppLanguage.EN) "Expense" else "খরচ",
                        fontWeight = FontWeight.Bold,
                        color = if (isExpense) Color.White else Slate400,
                        fontSize = 14.sp
                    )
                }
            }

            Surface(
                shape = RoundedCornerShape(10.dp),
                color = if (!isExpense) Emerald500 else Color.Transparent,
                modifier = Modifier
                    .weight(1f)
                    .testTag("entry_type_income_btn")
                    .clickable { viewModel.setEntryType(TransactionType.Income) }
            ) {
                Box(
                    modifier = Modifier.padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (language == AppLanguage.EN) "Income" else "আয়",
                        fontWeight = FontWeight.Bold,
                        color = if (!isExpense) Slate900 else Slate400,
                        fontSize = 14.sp
                    )
                }
            }
        }

        // Amount Display Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate800),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.fillMaxWidth().testTag("calc_display_card")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalAlignment = Alignment.End
            ) {
                Text(
                    text = if (language == AppLanguage.EN) "AMOUNT" else "টাকার পরিমাণ",
                    fontSize = 11.sp,
                    color = Slate400,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${if (language == AppLanguage.BN) "৳ " else "$ "}$calcDisplay",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isExpense) Rose500 else Emerald500
                )
            }
        }

        // Date & Note Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = entryDate,
                onValueChange = { viewModel.setEntryDate(it) },
                label = { Text(if (language == AppLanguage.EN) "Date" else "তারিখ", fontSize = 12.sp) },
                leadingIcon = {
                    Icon(Icons.Default.CalendarToday, contentDescription = "Date", tint = Sky500, modifier = Modifier.size(16.dp))
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = Sky500,
                    unfocusedBorderColor = Slate700
                ),
                modifier = Modifier.weight(1.2f).testTag("entry_date_input")
            )

            OutlinedTextField(
                value = entryNote,
                onValueChange = { viewModel.setEntryNote(it) },
                label = { Text(if (language == AppLanguage.EN) "Note" else "নোট (ঐচ্ছিক)", fontSize = 12.sp) },
                leadingIcon = {
                    Icon(Icons.Default.Note, contentDescription = "Note", tint = Sky500, modifier = Modifier.size(16.dp))
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = Sky500,
                    unfocusedBorderColor = Slate700
                ),
                modifier = Modifier.weight(1.8f).testTag("entry_note_input")
            )
        }

        // Category Horizontal Selector
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (language == AppLanguage.EN) "Category" else "ক্যাটাগরি",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = if (language == AppLanguage.EN) "+ Add Category" else "+ নতুন ক্যাটাগরি",
                    fontSize = 12.sp,
                    color = Sky500,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier
                        .testTag("add_category_shortcut")
                        .clickable { viewModel.setShowAddCategoryModal(true, entryType) }
                )
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                categories.forEach { cat ->
                    val isSelected = entryCategory == cat
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (isSelected) (if (isExpense) Rose500 else Emerald500) else Slate800,
                        modifier = Modifier
                            .testTag("category_chip_$cat")
                            .clickable { viewModel.setEntryCategory(cat) }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(FormatUtils.getCategoryEmoji(cat), fontSize = 14.sp)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = cat,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                color = if (isSelected) (if (isExpense) Color.White else Slate900) else Slate400
                            )
                        }
                    }
                }
            }
        }

        // Keypad Calculator Section
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate800),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val buttonRows = listOf(
                    listOf("C", "/", "*", "DEL"),
                    listOf("7", "8", "9", "-"),
                    listOf("4", "5", "6", "+"),
                    listOf("1", "2", "3", "=")
                )

                buttonRows.forEach { row ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        row.forEach { key ->
                            KeypadButton(
                                label = key,
                                onClick = { viewModel.onCalcKey(key) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }

                // Bottom row: 0, 00, ., Save
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    KeypadButton(
                        label = "0",
                        onClick = { viewModel.onCalcKey("0") },
                        modifier = Modifier.weight(1f)
                    )
                    KeypadButton(
                        label = "00",
                        onClick = { viewModel.onCalcKey("00") },
                        modifier = Modifier.weight(1f)
                    )
                    KeypadButton(
                        label = ".",
                        onClick = { viewModel.onCalcKey(".") },
                        modifier = Modifier.weight(1f)
                    )
                    // Save Button
                    Button(
                        onClick = { viewModel.saveTransaction() },
                        colors = ButtonDefaults.buttonColors(containerColor = if (isExpense) Rose500 else Emerald500),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("save_transaction_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = "Save",
                            tint = if (isExpense) Color.White else Slate900
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun KeypadButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isOperator = label in listOf("/", "*", "-", "+", "=")
    val isSpecial = label in listOf("C", "DEL")

    val bg = when {
        isSpecial -> Slate700
        isOperator -> Sky500.copy(alpha = 0.25f)
        else -> Slate900
    }

    val textColor = when {
        isSpecial -> Rose500
        isOperator -> Sky500
        else -> Color.White
    }

    Surface(
        shape = RoundedCornerShape(10.dp),
        color = bg,
        modifier = modifier
            .height(48.dp)
            .testTag("calc_key_$label")
            .clickable { onClick() }
    ) {
        Box(contentAlignment = Alignment.Center) {
            if (label == "DEL") {
                Icon(
                    Icons.Default.Backspace,
                    contentDescription = "DEL",
                    tint = textColor,
                    modifier = Modifier.size(18.dp)
                )
            } else {
                Text(
                    text = label,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = textColor
                )
            }
        }
    }
}
