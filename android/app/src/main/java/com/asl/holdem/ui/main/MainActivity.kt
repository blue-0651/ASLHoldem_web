package com.asl.holdem.ui.main

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle

import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.asl.holdem.BuildConfig
import com.asl.holdem.config.AppConfig
import com.asl.holdem.ui.main.components.WebViewScreen

import com.asl.holdem.ui.theme.ASLHoldemTheme
import com.google.accompanist.systemuicontroller.rememberSystemUiController
import dagger.hilt.android.AndroidEntryPoint

/**
 * 메인 액티비티
 * ASL Holdem Advertisement 페이지를 WebView로 표시합니다.
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    private val viewModel: MainViewModel by viewModels()
    
    // 권한 요청 런처
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        viewModel.updatePermissions(permissions)
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            ASLHoldemTheme {
                val systemUiController = rememberSystemUiController()
                
                // 상태바 색상 설정 - 전체화면 사용
                SideEffect {
                    systemUiController.setSystemBarsColor(
                        color = Color.Transparent,
                        darkIcons = true
                    )
                    // 시스템 UI 패딩 제거하여 전체화면 사용
                    systemUiController.isSystemBarsVisible = true
                }
                
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainContent()
                }
            }
        }
        
        // UI가 준비된 후 권한 체크 (초기 상태 설정)
        viewModel.setPermissionCheckStarted()
        checkAndRequestPermissions()
    }
    
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    private fun MainContent() {
        val uiState by viewModel.uiState.collectAsStateWithLifecycle()
        
        // TopAppBar 제거하고 전체 화면 사용
        Box(
            modifier = Modifier.fillMaxSize()
        ) {
            when {
                !uiState.hasPermissions -> {
                    PermissionRequiredScreen(
                        onRequestPermissions = { checkAndRequestPermissions() }
                    )
                }
                
                !uiState.hasNetworkConnection -> {
                    NetworkErrorScreen(
                        onRetry = { viewModel.checkNetworkConnection() }
                    )
                }
                
                else -> {
                    // 바로 Advertisement 페이지 로드 (SwipeRefreshLayout 포함)
                    WebViewScreen(
                        url = getAdvertisementUrl(),
                        isLoading = uiState.isLoading,
                        onLoadingChanged = { isLoading ->
                            viewModel.setLoading(isLoading)
                        },
                        onError = { error ->
                            viewModel.setError(error)
                        },
                        onRefresh = { 
                            viewModel.refreshWebView()
                        }
                    )
                }
            }
        }
    }
    
    /**
     * Advertisement 페이지 URL 반환
     */
    private fun getAdvertisementUrl(): String {
        // AslAd 페이지로 설정
        val url = if (BuildConfig.DEBUG) {
            "${AppConfig.BASE_URL}/mobile/advertisement"  // ASL 광고 페이지
        } else {
            "${AppConfig.BASE_URL}/mobile/advertisement"  // 실제 페이지
        }
        
        // 디버그 모드에서 URL 로그 출력
        if (BuildConfig.DEBUG) {
            android.util.Log.d("MainActivity", "WebView URL: $url")
            android.util.Log.d("MainActivity", "BASE_URL: ${BuildConfig.BASE_URL}")
            android.util.Log.d("MainActivity", "API_URL: ${BuildConfig.API_URL}")
            android.util.Log.d("MainActivity", "Using React AslAd page")
        }
        
        return url
    }
    
    @Composable
    private fun PermissionRequiredScreen(
        onRequestPermissions: () -> Unit
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                Icons.Default.Security,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "앱 권한이 필요합니다",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "원활한 서비스 이용을 위해\n다음 권한들이 필요합니다:",
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // 필요한 권한 목록 표시
            PermissionsList()
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Button(
                onClick = onRequestPermissions,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    Icons.Default.Check,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("권한 허용하기")
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            OutlinedButton(
                onClick = { viewModel.allowAppToRun() },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    "일단 시작하기",
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "일부 기능이 제한될 수 있습니다",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
    
    @Composable
    private fun PermissionsList() {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            PermissionItem(
                icon = Icons.Default.CameraAlt,
                title = "카메라",
                description = "프로필 사진 촬영 및 QR코드 스캔"
            )
            
            PermissionItem(
                icon = Icons.Default.Photo,
                title = "저장소",
                description = "사진 업로드 및 파일 다운로드"
            )
            
            PermissionItem(
                icon = Icons.Default.LocationOn,
                title = "위치",
                description = "주변 매장 찾기 (선택사항)"
            )
        }
    }
    
    @Composable
    private fun PermissionItem(
        icon: androidx.compose.ui.graphics.vector.ImageVector,
        title: String,
        description: String
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                icon,
                contentDescription = null,
                modifier = Modifier.size(24.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column {
                Text(
                    text = title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = description,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
    
    @Composable
    private fun NetworkErrorScreen(
        onRetry: () -> Unit
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                Icons.Default.SignalWifiOff,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.error
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "네트워크 연결 없음",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "인터넷 연결을 확인하고 다시 시도해주세요.",
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Button(
                onClick = onRetry,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("다시 시도")
            }
        }
    }
    
    /**
     * 웹 URL 반환 (기존 호환성을 위해 유지)
     */
    private fun getWebUrl(userType: UserType): String {
        val baseUrl = BuildConfig.BASE_URL
        return when (userType) {
            UserType.CUSTOMER -> "$baseUrl/mobile"
            UserType.STORE_MANAGER -> "$baseUrl/mobile/store"
        }
    }
    
    /**
     * 권한 확인 및 요청
     */
    private fun checkAndRequestPermissions() {
        // Android 버전에 따른 필수 권한 목록
        val requiredPermissions = buildList {
            // 카메라 권한 (중요)
            add(Manifest.permission.CAMERA)
            
            // 위치 권한 (매장 찾기 기능용)
            add(Manifest.permission.ACCESS_FINE_LOCATION)
            add(Manifest.permission.ACCESS_COARSE_LOCATION)
            
            // 파일 접근 권한 (Android 버전별 분기)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // Android 13 이상
                add(Manifest.permission.READ_MEDIA_IMAGES)
                add(Manifest.permission.READ_MEDIA_VIDEO)
                add(Manifest.permission.READ_MEDIA_AUDIO)
            } else {
                // Android 12 이하
                add(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }
        
        // 자동으로 허용되는 권한들 (런타임 권한이 아님)
        val autoGrantedPermissions = arrayOf(
            Manifest.permission.INTERNET,
            Manifest.permission.ACCESS_NETWORK_STATE,
            Manifest.permission.ACCESS_WIFI_STATE,
            Manifest.permission.WAKE_LOCK
        )
        
        // 요청이 필요한 권한 필터링
        val permissionsToRequest = requiredPermissions.filter { permission ->
            ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED
        }
        
        if (permissionsToRequest.isNotEmpty()) {
            // 권한 요청
            permissionLauncher.launch(permissionsToRequest.toTypedArray())
        } else {
            // 모든 권한이 이미 허용됨
            val allPermissions = (requiredPermissions + autoGrantedPermissions).associateWith { true }
            viewModel.updatePermissions(allPermissions)
        }
    }
    
    /**
     * 필수 권한이 모두 허용되었는지 확인
     */
    private fun hasEssentialPermissions(): Boolean {
        // 최소한 카메라 권한만 있으면 앱 실행 가능
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
    }
}

/**
 * 사용자 타입 다이얼로그 (기존 호환성을 위해 유지하지만 사용되지 않음)
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun UserTypeDialog(
    currentUserType: UserType?,
    onUserTypeSelected: (UserType) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("사용자 타입 선택")
        },
        text = {
            Column {
                Text("어떤 유형의 사용자로 접속하시겠습니까?")
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = { onUserTypeSelected(UserType.CUSTOMER) },
                        modifier = Modifier.weight(1f),
                        colors = if (currentUserType == UserType.CUSTOMER) {
                            ButtonDefaults.outlinedButtonColors(
                                containerColor = MaterialTheme.colorScheme.primary,
                                contentColor = Color.White
                            )
                        } else {
                            ButtonDefaults.outlinedButtonColors()
                        }
                    ) {
                        Text("일반사용자")
                    }
                    
                    OutlinedButton(
                        onClick = { onUserTypeSelected(UserType.STORE_MANAGER) },
                        modifier = Modifier.weight(1f),
                        colors = if (currentUserType == UserType.STORE_MANAGER) {
                            ButtonDefaults.outlinedButtonColors(
                                containerColor = MaterialTheme.colorScheme.primary,
                                contentColor = Color.White
                            )
                        } else {
                            ButtonDefaults.outlinedButtonColors()
                        }
                    ) {
                        Text("매장관리자")
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("닫기")
            }
        }
    )
} 