package com.abujar.hisabkitab.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.abujar.hisabkitab.model.AppLanguage
import com.abujar.hisabkitab.model.Transaction
import com.abujar.hisabkitab.model.TransactionType
import com.abujar.hisabkitab.ui.theme.Emerald500
import com.abujar.hisabkitab.ui.theme.Rose500
import com.abujar.hisabkitab.ui.theme.Sky500
import com.abujar.hisabkitab.ui.theme.Slate400
import com.abujar.hisabkitab.ui.theme.Slate600
import com.abujar.hisabkitab.ui.theme.Slate700
import com.abujar.hisabkitab.ui.theme.Slate800
import com.abujar.hisabkitab.ui.theme.Slate900
import com.abujar.hisabkitab.utils.FormatUtils

@Composable
fun DayDetailsDialog(
    dateStr: String,
    transactions: List<Transaction>,
    language: AppLanguage,
    onDismiss: () -> Unit,
    onEdit: (Transaction) -> Unit,
    onDelete: (Transaction) -> Unit,
    onAddForDate: (String) -> Unit
) {
    val dayTxs = transactions.filter { it.date == dateStr }
    val totalExp = dayTxs.filter { it.type == TransactionType.Expense }.sumOf { it.value }
    val totalInc = dayTxs.filter { it.type == TransactionType.Income }.sumOf { it.value }
    val net = totalInc - totalExp

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = Slate900,
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = if (language == AppLanguage.EN) "Day Details" else "দিনের বিস্তারিত",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = dateStr,
                            fontSize = 13.sp,
                            color = Slate400
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Slate400)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Stats row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Slate800),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text(
                                if (language == AppLanguage.EN) "Income" else "আয়",
                                fontSize = 11.sp,
                                color = Slate400
                            )
                            Text(
                                "+${FormatUtils.formatCurrency(totalInc, language)}",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Emerald500
                            )
                        }
                    }
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Slate800),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text(
                                if (language == AppLanguage.EN) "Expense" else "খরচ",
                                fontSize = 11.sp,
                                color = Slate400
                            )
                            Text(
                                "-${FormatUtils.formatCurrency(totalExp, language)}",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Rose500
                            )
                        }
                    }
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Slate800),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text(
                                if (language == AppLanguage.EN) "Net" else "ব্যালেন্স",
                                fontSize = 11.sp,
                                color = Slate400
                            )
                            Text(
                                FormatUtils.formatCurrency(net, language),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (net >= 0) Emerald500 else Rose500
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Transaction list
                if (dayTxs.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (language == AppLanguage.EN) "No transactions on this day" else "এই দিনে কোনো হিসাব নেই",
                            color = Slate400,
                            fontSize = 13.sp
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        items(dayTxs) { tx ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Slate800),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        FormatUtils.getCategoryEmoji(tx.category),
                                        fontSize = 18.sp
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            tx.category,
                                            fontWeight = FontWeight.Medium,
                                            color = Color.White,
                                            fontSize = 13.sp
                                        )
                                        if (tx.note.isNotBlank()) {
                                            Text(tx.note, color = Slate400, fontSize = 11.sp)
                                        }
                                    }
                                    Text(
                                        text = "${if (tx.type == TransactionType.Income) "+" else "-"}${FormatUtils.formatCurrency(tx.value, language)}",
                                        fontWeight = FontWeight.Bold,
                                        color = if (tx.type == TransactionType.Income) Emerald500 else Rose500,
                                        fontSize = 13.sp
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    IconButton(
                                        onClick = { onEdit(tx) },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.Edit,
                                            contentDescription = "Edit",
                                            tint = Sky500,
                                            modifier = Modifier.size(14.dp)
                                        )
                                    }
                                    IconButton(
                                        onClick = { onDelete(tx) },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.Delete,
                                            contentDescription = "Delete",
                                            tint = Rose500,
                                            modifier = Modifier.size(14.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = {
                        onDismiss()
                        onAddForDate(dateStr)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Sky500),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        if (language == AppLanguage.EN) "+ Add Entry for this day" else "+ এই দিনে নতুন হিসাব যোগ করুন",
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )
                }
            }
        }
    }
}

@Composable
fun EditTransactionDialog(
    transaction: Transaction,
    categories: List<String>,
    language: AppLanguage,
    onDismiss: () -> Unit,
    onSave: (Transaction) -> Unit
) {
    var amountText by remember { mutableStateOf(transaction.value.toString()) }
    var noteText by remember { mutableStateOf(transaction.note) }
    var selectedCategory by remember { mutableStateOf(transaction.category) }
    var selectedType by remember { mutableStateOf(transaction.type) }
    var dateText by remember { mutableStateOf(transaction.date) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Slate900,
        title = {
            Text(
                if (language == AppLanguage.EN) "Edit Transaction" else "লেনদেন সংশোধন করুন",
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                // Type selector
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { selectedType = TransactionType.Expense },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selectedType == TransactionType.Expense) Rose500 else Slate800
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(if (language == AppLanguage.EN) "Expense" else "খরচ")
                    }
                    Button(
                        onClick = { selectedType = TransactionType.Income },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selectedType == TransactionType.Income) Emerald500 else Slate800
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(if (language == AppLanguage.EN) "Income" else "আয়")
                    }
                }

                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it },
                    label = { Text(if (language == AppLanguage.EN) "Amount" else "পরিমাণ") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Sky500,
                        unfocusedBorderColor = Slate700
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = dateText,
                    onValueChange = { dateText = it },
                    label = { Text(if (language == AppLanguage.EN) "Date (YYYY-MM-DD)" else "তারিখ") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Sky500,
                        unfocusedBorderColor = Slate700
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = noteText,
                    onValueChange = { noteText = it },
                    label = { Text(if (language == AppLanguage.EN) "Note" else "নোট") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Sky500,
                        unfocusedBorderColor = Slate700
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val amount = amountText.toDoubleOrNull() ?: transaction.value
                    onSave(
                        transaction.copy(
                            value = amount,
                            note = noteText,
                            category = selectedCategory,
                            type = selectedType,
                            date = dateText
                        )
                    )
                },
                colors = ButtonDefaults.buttonColors(containerColor = Sky500)
            ) {
                Text(if (language == AppLanguage.EN) "Save" else "সেভ", color = Slate900)
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text(if (language == AppLanguage.EN) "Cancel" else "বাতিল", color = Slate400)
            }
        }
    )
}

@Composable
fun DeleteConfirmDialog(
    transaction: Transaction,
    language: AppLanguage,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Slate900,
        title = {
            Text(
                if (language == AppLanguage.EN) "Delete Transaction?" else "লেনদেন মুছে ফেলবেন?",
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        },
        text = {
            Text(
                text = if (language == AppLanguage.EN)
                    "Are you sure you want to delete ${transaction.category} (${FormatUtils.formatCurrency(transaction.value, language)})?"
                else
                    "আপনি কি নিশ্চিত যে ${transaction.category} (${FormatUtils.formatCurrency(transaction.value, language)}) মুছে ফেলতে চান?",
                color = Slate400
            )
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = Rose500)
            ) {
                Text(if (language == AppLanguage.EN) "Delete" else "মুছুন", color = Color.White)
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text(if (language == AppLanguage.EN) "Cancel" else "বাতিল", color = Slate400)
            }
        }
    )
}

@Composable
fun AddUserDialog(
    language: AppLanguage,
    onDismiss: () -> Unit,
    onConfirm: (name: String, uname: String, pass: String, role: String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("member") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Slate900,
        title = {
            Text(
                if (language == AppLanguage.EN) "Add New Member" else "নতুন সদস্য যোগ করুন",
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text(if (language == AppLanguage.EN) "Full Name" else "পুরো নাম") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Sky500,
                        unfocusedBorderColor = Slate700
                    ),
                    modifier = Modifier.fillMaxWidth().testTag("user_name_input")
                )
                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    label = { Text(if (language == AppLanguage.EN) "Username" else "ইউজারনেম") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Sky500,
                        unfocusedBorderColor = Slate700
                    ),
                    modifier = Modifier.fillMaxWidth().testTag("user_username_input")
                )
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text(if (language == AppLanguage.EN) "Password" else "পাসওয়ার্ড") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Sky500,
                        unfocusedBorderColor = Slate700
                    ),
                    modifier = Modifier.fillMaxWidth().testTag("user_password_input")
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank() && username.isNotBlank() && password.isNotBlank()) {
                        onConfirm(name, username, password, role)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Sky500),
                modifier = Modifier.testTag("save_user_button")
            ) {
                Text(if (language == AppLanguage.EN) "Create" else "তৈরি করুন", color = Slate900)
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text(if (language == AppLanguage.EN) "Cancel" else "বাতিল", color = Slate400)
            }
        }
    )
}

@Composable
fun AddCategoryDialog(
    type: TransactionType,
    language: AppLanguage,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var categoryName by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Slate900,
        title = {
            Text(
                if (language == AppLanguage.EN) "Add ${type.name} Category" else "নতুন ${if (type == TransactionType.Expense) "খরচের" else "আয়ের"} ক্যাটাগরি",
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        },
        text = {
            Column {
                OutlinedTextField(
                    value = categoryName,
                    onValueChange = { categoryName = it },
                    label = { Text(if (language == AppLanguage.EN) "Category Name (e.g. 📚 Books)" else "ক্যাটাগরির নাম") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Sky500,
                        unfocusedBorderColor = Slate700
                    ),
                    modifier = Modifier.fillMaxWidth().testTag("category_name_input")
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (categoryName.isNotBlank()) {
                        onConfirm(categoryName.trim())
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Sky500),
                modifier = Modifier.testTag("save_category_button")
            ) {
                Text(if (language == AppLanguage.EN) "Add" else "যোগ করুন", color = Slate900)
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text(if (language == AppLanguage.EN) "Cancel" else "বাতিল", color = Slate400)
            }
        }
    )
}

@Composable
fun EditProfileDialog(
    currentName: String,
    language: AppLanguage,
    onDismiss: () -> Unit,
    onConfirm: (name: String, pass: String) -> Unit
) {
    var name by remember { mutableStateOf(currentName) }
    var password by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Slate900,
        title = {
            Text(
                if (language == AppLanguage.EN) "Edit Profile" else "প্রোফাইল পরিবর্তন",
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text(if (language == AppLanguage.EN) "Display Name" else "নাম") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Sky500,
                        unfocusedBorderColor = Slate700
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text(if (language == AppLanguage.EN) "New Password (optional)" else "নতুন পাসওয়ার্ড (ঐচ্ছিক)") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Sky500,
                        unfocusedBorderColor = Slate700
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(name, password) },
                colors = ButtonDefaults.buttonColors(containerColor = Sky500)
            ) {
                Text(if (language == AppLanguage.EN) "Save" else "সেভ", color = Slate900)
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text(if (language == AppLanguage.EN) "Cancel" else "বাতিল", color = Slate400)
            }
        }
    )
}
