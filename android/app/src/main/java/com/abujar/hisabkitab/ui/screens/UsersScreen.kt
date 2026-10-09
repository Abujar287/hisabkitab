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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import com.abujar.hisabkitab.model.AppUser
import com.abujar.hisabkitab.ui.theme.Emerald500
import com.abujar.hisabkitab.ui.theme.Rose500
import com.abujar.hisabkitab.ui.theme.Sky500
import com.abujar.hisabkitab.ui.theme.Slate400
import com.abujar.hisabkitab.ui.theme.Slate700
import com.abujar.hisabkitab.ui.theme.Slate800
import com.abujar.hisabkitab.ui.theme.Slate900
import com.abujar.hisabkitab.ui.viewmodel.HisabViewModel

@Composable
fun UsersScreen(
    viewModel: HisabViewModel,
    modifier: Modifier = Modifier
) {
    val language by viewModel.language.collectAsState()
    val users by viewModel.users.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Slate900)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Header & Add User Action
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = if (language == AppLanguage.EN) "User Management" else "ব্যবহারকারী ব্যবস্থাপনা",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = if (language == AppLanguage.EN) "Multi-account financial isolation" else "স্বতন্ত্র হিসাব ও প্রোফাইল",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Slate400,
                    fontSize = 12.sp
                )
            }

            Button(
                onClick = { viewModel.setShowAddUserModal(true) },
                colors = ButtonDefaults.buttonColors(containerColor = Sky500),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.testTag("add_user_button")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add", tint = Slate900, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = if (language == AppLanguage.EN) "Add" else "যোগ করুন",
                    color = Slate900,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }
        }

        // Active Profile Banner
        currentUser?.let { active ->
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate800),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth().testTag("active_user_card")
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(Sky500),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = active.displayName.take(1).uppercase(),
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = active.displayName,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                fontSize = 15.sp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = Sky500.copy(alpha = 0.2f)
                            ) {
                                Text(
                                    text = if (active.role == "admin") "ADMIN" else "MEMBER",
                                    color = Sky500,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Text(
                            text = "@${active.username} • Tab: ${active.sheetTab}",
                            color = Slate400,
                            fontSize = 12.sp
                        )
                    }

                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Active",
                        tint = Emerald500,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
        }

        // All Users List
        Text(
            text = if (language == AppLanguage.EN) "All Registered Accounts (${users.size})" else "সকল অ্যাকাউন্ট (${users.size}টি)",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = Slate400
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(users, key = { it.username }) { user ->
                val isActiveUser = currentUser?.username == user.username
                Card(
                    colors = CardDefaults.cardColors(containerColor = Slate800),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().testTag("user_row_${user.username}")
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(if (isActiveUser) Sky500 else Slate700),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = user.displayName.take(1).uppercase(),
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }

                        Spacer(modifier = Modifier.width(10.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = user.displayName,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    fontSize = 14.sp
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                if (user.role == "admin") {
                                    Icon(
                                        Icons.Default.Shield,
                                        contentDescription = "Admin",
                                        tint = Sky500,
                                        modifier = Modifier.size(13.dp)
                                    )
                                }
                            }
                            Text(
                                text = "@${user.username}",
                                color = Slate400,
                                fontSize = 12.sp
                            )
                        }

                        // Switch User Button
                        if (!isActiveUser) {
                            Button(
                                onClick = { viewModel.switchUser(user) },
                                colors = ButtonDefaults.buttonColors(containerColor = Slate700),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.testTag("switch_to_${user.username}")
                            ) {
                                Text(
                                    text = if (language == AppLanguage.EN) "Switch" else "সুইচ",
                                    fontSize = 11.sp,
                                    color = Color.White
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(6.dp))

                        // Active Toggle Switch
                        Switch(
                            checked = user.isActive,
                            onCheckedChange = { viewModel.toggleUserActive(user) },
                            enabled = user.username != "abujar287",
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Emerald500,
                                checkedTrackColor = Emerald500.copy(alpha = 0.3f),
                                uncheckedThumbColor = Slate400,
                                uncheckedTrackColor = Slate700
                            ),
                            modifier = Modifier.size(36.dp)
                        )

                        Spacer(modifier = Modifier.width(6.dp))

                        // Delete button (disabled for abujar287)
                        if (user.username != "abujar287") {
                            IconButton(
                                onClick = { viewModel.deleteUser(user) },
                                modifier = Modifier.size(28.dp).testTag("delete_user_${user.username}")
                            ) {
                                Icon(
                                    Icons.Default.Delete,
                                    contentDescription = "Delete User",
                                    tint = Rose500,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
