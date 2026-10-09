package com.abujar.hisabkitab.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.abujar.hisabkitab.model.AppLanguage
import com.abujar.hisabkitab.model.AppUser
import com.abujar.hisabkitab.ui.theme.Sky500
import com.abujar.hisabkitab.ui.theme.Slate400
import com.abujar.hisabkitab.ui.theme.Slate700
import com.abujar.hisabkitab.ui.theme.Slate800
import com.abujar.hisabkitab.ui.theme.Slate900

@Composable
fun HisabHeader(
    currentUser: AppUser?,
    language: AppLanguage,
    isSyncing: Boolean,
    lastSyncTime: String,
    onToggleLanguage: () -> Unit,
    onManualSync: () -> Unit,
    onProfileClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "sync_rotate")
    val rotationAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1000, easing = LinearEasing)
        ),
        label = "sync_spin"
    )

    Surface(
        color = Slate900,
        modifier = modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // App Title & Current User
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable { onProfileClick() }
                    .padding(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(Sky500),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = (currentUser?.displayName?.take(1) ?: "A").uppercase(),
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 16.sp
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = if (language == AppLanguage.EN) "Hisab Kitab" else "হিসাব-নিকাশ",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = currentUser?.displayName ?: "User",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Slate400,
                        fontSize = 12.sp
                    )
                }
            }

            // Language switch & Sync button
            Row(verticalAlignment = Alignment.CenterVertically) {
                // Language Pill
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Slate800,
                    modifier = Modifier
                        .testTag("language_toggle_button")
                        .clickable { onToggleLanguage() }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Language,
                            contentDescription = "Language",
                            tint = Sky500,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (language == AppLanguage.EN) "EN" else "বাং",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 12.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Sync Button
                IconButton(
                    onClick = onManualSync,
                    enabled = !isSyncing,
                    modifier = Modifier
                        .testTag("manual_sync_button")
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Slate800)
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Sync",
                        tint = Sky500,
                        modifier = Modifier
                            .size(18.dp)
                            .then(if (isSyncing) Modifier.rotate(rotationAngle) else Modifier)
                    )
                }
            }
        }
    }
}
