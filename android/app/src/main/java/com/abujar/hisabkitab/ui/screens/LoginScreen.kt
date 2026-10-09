package com.abujar.hisabkitab.ui.screens

import androidx.compose.foundation.Image
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.abujar.hisabkitab.R
import com.abujar.hisabkitab.model.AppLanguage
import com.abujar.hisabkitab.ui.theme.Sky500
import com.abujar.hisabkitab.ui.theme.Slate400
import com.abujar.hisabkitab.ui.theme.Slate700
import com.abujar.hisabkitab.ui.theme.Slate800
import com.abujar.hisabkitab.ui.theme.Slate900
import com.abujar.hisabkitab.ui.viewmodel.HisabViewModel

@Composable
fun LoginScreen(
    viewModel: HisabViewModel,
    modifier: Modifier = Modifier
) {
    val language by viewModel.language.collectAsState()
    var username by remember { mutableStateOf("abujar287") }
    var password by remember { mutableStateOf("hisabkitab") }
    var passwordVisible by remember { mutableStateOf(false) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Slate900)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // App Logo
            Image(
                painter = painterResource(id = R.drawable.img_app_icon),
                contentDescription = "App Logo",
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(20.dp))
            )

            // Title & Subtitle
            Text(
                text = if (language == AppLanguage.EN) "Hisab Kitab" else "হিসাব-নিকাশ",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )

            Text(
                text = if (language == AppLanguage.EN)
                    "Personal Income & Expense Tracker"
                else
                    "স্মার্ট ব্যক্তিগত আয় ও ব্যয়ের হিসাব",
                style = MaterialTheme.typography.bodyMedium,
                color = Slate400,
                fontSize = 13.sp
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Login Card
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate800),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text(
                        text = if (language == AppLanguage.EN) "Sign In" else "লগইন করুন",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )

                    OutlinedTextField(
                        value = username,
                        onValueChange = { username = it },
                        label = { Text(if (language == AppLanguage.EN) "Username" else "ইউজারনেম") },
                        leadingIcon = {
                            Icon(Icons.Default.Person, contentDescription = "User", tint = Sky500)
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Sky500,
                            unfocusedBorderColor = Slate700
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth().testTag("login_username_input")
                    )

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text(if (language == AppLanguage.EN) "Password" else "পাসওয়ার্ড") },
                        leadingIcon = {
                            Icon(Icons.Default.Lock, contentDescription = "Lock", tint = Sky500)
                        },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = "Toggle password",
                                    tint = Slate400
                                )
                            }
                        },
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Sky500,
                            unfocusedBorderColor = Slate700
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth().testTag("login_password_input")
                    )

                    // Quick Demo Credentials Fill
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Slate700.copy(alpha = 0.5f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                username = "abujar287"
                                password = "hisabkitab"
                            }
                    ) {
                        Text(
                            text = "Admin default: abujar287 / hisabkitab (Tap to fill)",
                            color = Slate400,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        )
                    }

                    Button(
                        onClick = { viewModel.login(username, password) },
                        colors = ButtonDefaults.buttonColors(containerColor = Sky500),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .testTag("login_submit_button")
                    ) {
                        Text(
                            text = if (language == AppLanguage.EN) "Log In" else "প্রবেশ করুন",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900
                        )
                    }
                }
            }
        }
    }
}
