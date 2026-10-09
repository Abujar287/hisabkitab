package com.abujar.hisabkitab.ui.components

import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.abujar.hisabkitab.model.AppLanguage
import com.abujar.hisabkitab.ui.theme.Sky500
import com.abujar.hisabkitab.ui.theme.Slate400
import com.abujar.hisabkitab.ui.theme.Slate700
import com.abujar.hisabkitab.ui.theme.Slate900

data class NavItem(
    val titleEn: String,
    val titleBn: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val tag: String
)

val NAV_ITEMS = listOf(
    NavItem("Summary", "সারসংক্ষেপ", Icons.Default.BarChart, "nav_summary"),
    NavItem("Entry", "নতুন হিসাব", Icons.Default.AddCircle, "nav_entry"),
    NavItem("Details", "লেনদেন", Icons.Default.List, "nav_details"),
    NavItem("Users", "ব্যবহারকারী", Icons.Default.People, "nav_users"),
    NavItem("Settings", "সেটিংস", Icons.Default.Settings, "nav_settings")
)

@Composable
fun HisabBottomNavigation(
    selectedTab: Int,
    language: AppLanguage,
    onTabSelected: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    NavigationBar(
        containerColor = Slate900,
        contentColor = Color.White,
        modifier = modifier
    ) {
        NAV_ITEMS.forEachIndexed { index, item ->
            val selected = selectedTab == index
            NavigationBarItem(
                selected = selected,
                onClick = { onTabSelected(index) },
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.titleEn,
                        modifier = Modifier.size(24.dp)
                    )
                },
                label = {
                    Text(
                        text = if (language == AppLanguage.EN) item.titleEn else item.titleBn,
                        fontSize = 11.sp,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Sky500,
                    selectedTextColor = Sky500,
                    unselectedIconColor = Slate400,
                    unselectedTextColor = Slate400,
                    indicatorColor = Slate700
                ),
                modifier = Modifier.testTag(item.tag)
            )
        }
    }
}
