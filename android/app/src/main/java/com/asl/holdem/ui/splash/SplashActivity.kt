package com.asl.holdem.ui.splash

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.asl.holdem.R
import com.asl.holdem.ui.main.MainActivity
import com.asl.holdem.ui.theme.ASLHoldemTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.delay

/**
 * 스플래시 화면 액티비티
 * 현재는 기본 구현으로, 향후 로고, 애니메이션 등을 추가할 수 있습니다.
 */
@AndroidEntryPoint
class SplashActivity : ComponentActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // Android 12+ Splash Screen API 설치
        installSplashScreen()
        
        super.onCreate(savedInstanceState)
        
        setContent {
            ASLHoldemTheme {
                SplashScreen()
            }
        }
    }
    
    @Composable
    private fun SplashScreen() {
        // 스플래시 화면 표시 후 메인 액티비티로 이동
        LaunchedEffect(Unit) {
            delay(5000) // 2초 대기
            startMainActivity()
        }
        
        // 현재는 간단한 텍스트만 표시 (향후 로고 이미지로 대체 가능)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFFF8F8FF)), // 웹앱과 동일한 아이보리 색상
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Image(
                    painter = painterResource(id = R.drawable.asl_logo),
                    contentDescription = "ASL Logo",
                    modifier = Modifier
                        .size(374.dp)
                        .padding(16.dp),
                    contentScale = ContentScale.Fit
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                CircularProgressIndicator(
                    color = Color.White,
                    modifier = Modifier.size(32.dp)
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "로딩중...",
                    fontSize = 16.sp,
                    color = Color.White.copy(alpha = 0.8f)
                )
            }
        }
    }
    
    private fun startMainActivity() {
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
} 