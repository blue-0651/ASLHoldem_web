package com.asl.holdem.ui.main

import android.app.Application
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * 사용자 타입 열거형
 */
enum class UserType {
    CUSTOMER,        // 일반 사용자
    STORE_MANAGER   // 매장 관리자
}

/**
 * UI 상태 데이터 클래스
 */
data class MainUiState(
    val userType: UserType? = null,
    val isLoading: Boolean = false,
    val hasPermissions: Boolean = true, // 기본값을 true로 변경하여 권한 체크 후 결정
    val hasNetworkConnection: Boolean = true,
    val showUserTypeDialog: Boolean = false,
    val errorMessage: String? = null,
    val webViewUrl: String? = null,
    val refreshTrigger: Int = 0,
    val permissionCheckCompleted: Boolean = false
)

/**
 * 메인 액티비티 ViewModel
 * 앱의 전체적인 상태를 관리합니다.
 */
@HiltViewModel
class MainViewModel @Inject constructor(
    private val application: Application
) : AndroidViewModel(application) {
    
    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()
    
    init {
        checkNetworkConnection()
    }

    /**
     * 로딩 상태 설정
     */
    fun setLoading(isLoading: Boolean) {
        _uiState.value = _uiState.value.copy(isLoading = isLoading)
    }
    
    /**
     * 권한 상태 설정
     */
    fun setPermissionsGranted(granted: Boolean) {
        _uiState.value = _uiState.value.copy(
            hasPermissions = granted,
            errorMessage = if (!granted) "권한이 필요합니다" else null
        )
    }
    
    /**
     * 권한 업데이트 (권한 요청 결과 처리)
     */
    fun updatePermissions(permissions: Map<String, Boolean>) {
        val hasEssentialPermissions = permissions.entries.any { (permission, granted) ->
            // 카메라 권한이 있으면 기본적으로 앱 사용 가능
            permission.contains("CAMERA") && granted
        } || permissions.values.any { it } // 또는 하나라도 허용되면 일단 진행
        
        // 필수 권한이 아예 없는 경우에만 권한 요청 화면 표시
        val needsPermissions = !hasEssentialPermissions && permissions.isNotEmpty()
        
        _uiState.value = _uiState.value.copy(
            hasPermissions = !needsPermissions,
            errorMessage = if (needsPermissions) "일부 권한이 필요합니다" else null,
            permissionCheckCompleted = true
        )
    }
    
    /**
     * 앱 실행 허용 (부분 권한으로도 진행)
     */
    fun allowAppToRun() {
        _uiState.value = _uiState.value.copy(
            hasPermissions = true,
            errorMessage = null,
            permissionCheckCompleted = true
        )
    }
    
    /**
     * 권한 체크 시작
     */
    fun setPermissionCheckStarted() {
        _uiState.value = _uiState.value.copy(
            hasPermissions = false, // 체크 시작시 false로 설정
            permissionCheckCompleted = false
        )
    }
    
    /**
     * 네트워크 연결 상태 확인
     */
    fun checkNetworkConnection() {
        viewModelScope.launch {
            val hasConnection = isNetworkAvailable()
            _uiState.value = _uiState.value.copy(hasNetworkConnection = hasConnection)
        }
    }
    
    /**
     * 사용자 타입 선택 다이얼로그 표시
     */
    fun showUserTypeSelector() {
        _uiState.value = _uiState.value.copy(showUserTypeDialog = true)
    }
    
    /**
     * 사용자 타입 선택 다이얼로그 숨김
     */
    fun hideUserTypeSelector() {
        _uiState.value = _uiState.value.copy(showUserTypeDialog = false)
    }
    
    /**
     * WebView 새로고침
     */
    fun refreshWebView() {
        _uiState.value = _uiState.value.copy(
            refreshTrigger = _uiState.value.refreshTrigger + 1,
            errorMessage = null
        )
    }
    
    /**
     * 에러 설정
     */
    fun setError(error: String) {
        _uiState.value = _uiState.value.copy(
            errorMessage = error,
            isLoading = false
        )
    }
    
    /**
     * 에러 클리어
     */
    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
    
    /**
     * 네트워크 가용성 확인
     */
    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = application.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        
        val network = connectivityManager.activeNetwork ?: return false
        val networkCapabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        
        return when {
            networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> true
            networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> true
            networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> true
            else -> false
        }
    }
} 