package com.asl.holdem.ui.main.components

import android.webkit.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshContainer
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.input.nestedscroll.nestedScroll
import android.net.Uri
import android.webkit.WebView.setWebContentsDebuggingEnabled

/**
 * WebView 화면 컴포넌트
 * 웹앱을 표시하는 WebView를 Compose로 구현합니다.
 * SwipeRefreshLayout을 포함하여 당겨서 새로고침 기능을 제공합니다.
 */
//@SuppressLint("SetJavaScriptEnabled")
@OptIn(ExperimentalMaterial3Api::class)
@SuppressWarnings("SetJavaScriptEnabled")
@Composable
fun WebViewScreen(
    url: String,
    isLoading: Boolean,
    onLoadingChanged: (Boolean) -> Unit,
    onError: (String) -> Unit,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var webView by remember { mutableStateOf<WebView?>(null) }
    var currentUrl by remember { mutableStateOf(url) }
    var isRefreshing by remember { mutableStateOf(false) }
    val pullToRefreshState = rememberPullToRefreshState()
    
    // 로딩 상태를 PullToRefresh에 반영
    LaunchedEffect(isLoading) {
        isRefreshing = isLoading
    }
    
    // 새로고침 감지
    if (pullToRefreshState.isRefreshing) {
        LaunchedEffect(true) {
            android.util.Log.d("PullToRefresh", "Refresh triggered")
            onRefresh()
            webView?.reload()
        }
    }
    
    // 새로고침 완료 처리
    LaunchedEffect(isRefreshing) {
        if (!isRefreshing) {
            pullToRefreshState.endRefresh()
        }
    }
    
    // URL이 변경될 때 WebView 새로고침
    LaunchedEffect(url) {
        if (url != currentUrl) {
            currentUrl = url
            webView?.loadUrl(url)
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .statusBarsPadding()
            .nestedScroll(pullToRefreshState.nestedScrollConnection)
    ) {
        AndroidView(
            factory = { context ->
                WebView(context).apply {
                    webView = this

                    // 디버깅 활성화 (개발 모드에서만)
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
                        setWebContentsDebuggingEnabled(true)
                    }

                    // WebView 설정 - JavaScript 실행 문제 해결을 위한 강화된 설정
                    settings.apply {
                        // JavaScript 및 DOM 설정 (최우선)
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        databaseEnabled = true

                        // 파일 접근 권한 (React 앱 로딩을 위해 필요)
                        allowFileAccess = true
                        allowContentAccess = true
                        allowFileAccessFromFileURLs = true
                        allowUniversalAccessFromFileURLs = true

                        // 네트워크 및 보안 설정
                        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        blockNetworkImage = false
                        blockNetworkLoads = false

                        // 캐시 설정 (개발 중에는 캐시 사용 안함)
                        cacheMode = WebSettings.LOAD_NO_CACHE

                        // JavaScript 실행 환경 강화
                        javaScriptCanOpenWindowsAutomatically = true
                        setSupportMultipleWindows(false)
                        mediaPlaybackRequiresUserGesture = false

                        // 렌더링 설정
                        loadsImagesAutomatically = true
                        loadWithOverviewMode = true
                        useWideViewPort = true

                        // 확대/축소 설정
                        setSupportZoom(true)
                        builtInZoomControls = true
                        displayZoomControls = false
                        
                        // User Agent 설정 (ES6 modules 지원을 위해 최신 Chrome 사용)
                        userAgentString =
                            "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.210 Mobile Safari/537.36 ASLHoldemApp/1.0"

                        // 추가 설정들
                        setGeolocationEnabled(false)

                        // 하드웨어 가속 관련
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                            safeBrowsingEnabled = false
                        }

                        // API 레벨별 추가 설정
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.JELLY_BEAN_MR1) {
                            mediaPlaybackRequiresUserGesture = false
                        }

                        // 렌더링 우선순위
                        setRenderPriority(WebSettings.RenderPriority.HIGH)

                        // ES6 modules 및 최신 JavaScript 지원 강화
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                            // 최신 WebView 엔진 사용
                            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        }

                        // 강화된 JavaScript 엔진 설정
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
                            // Chrome DevTools 지원
                            setWebContentsDebuggingEnabled(true)
                        }
                    }

                    // PullToRefresh와의 호환성을 위한 WebView 설정
                    overScrollMode = WebView.OVER_SCROLL_NEVER
                    isVerticalScrollBarEnabled = true
                    isHorizontalScrollBarEnabled = false
                    isNestedScrollingEnabled = true

                    // WebViewClient 설정
                    webViewClient = object : WebViewClient() {
                        override fun onPageStarted(
                            view: WebView?,
                            url: String?,
                            favicon: android.graphics.Bitmap?
                        ) {
                            super.onPageStarted(view, url, favicon)
                            android.util.Log.d("WebViewScreen", "Page started loading: $url")
                            isRefreshing = true
                            onLoadingChanged(true)
                        }

                        override fun onPageFinished(view: WebView?, url: String?) {
                            super.onPageFinished(view, url)
                            android.util.Log.d("WebViewScreen", "Page finished loading: $url")
                            
                            // PullToRefresh 상태 업데이트
                            isRefreshing = false
                            onLoadingChanged(false)

                            // 간단한 페이지 로드 확인
                            view?.evaluateJavascript(
                                """
                                (function() {
                                    var root = document.getElementById('root');
                                    return JSON.stringify({
                                        hasRoot: !!root,
                                        hasContent: root && root.innerHTML.trim() !== '',
                                        url: window.location.href
                                    });
                                })();
                                """.trimIndent()
                            ) { result ->
                                android.util.Log.d("WebViewDebug", "Page check: $result")
                            }
                        }

                        override fun onReceivedError(
                            view: WebView?,
                            errorCode: Int,
                            description: String?,
                            failingUrl: String?
                        ) {
                            super.onReceivedError(view, errorCode, description, failingUrl)
                            android.util.Log.e(
                                "WebViewScreen",
                                "Page load error: $description (Code: $errorCode, URL: $failingUrl)"
                            )
                            isRefreshing = false
                            onLoadingChanged(false)
                            onError("페이지 로드 오류: $description")
                        }

                        override fun onReceivedHttpError(
                            view: WebView?,
                            request: WebResourceRequest?,
                            errorResponse: WebResourceResponse?
                        ) {
                            super.onReceivedHttpError(view, request, errorResponse)
                            if (request?.isForMainFrame == true) {
                                isRefreshing = false
                                onLoadingChanged(false)
                                onError("HTTP 오류: ${errorResponse?.statusCode}")
                            }
                        }

                        override fun shouldOverrideUrlLoading(
                            view: WebView?,
                            request: WebResourceRequest?
                        ): Boolean {
                            val url = request?.url?.toString() ?: return false

                            // 외부 앱으로 열어야 하는 URL들 처리
                            when {
                                url.startsWith("tel:") ||
                                        url.startsWith("mailto:") ||
                                        url.startsWith("sms:") -> {
                                    // 이런 URL들은 외부 앱에서 처리하도록 함
                                    return false
                                }

                                else -> {
                                    // 웹 URL은 WebView에서 처리
                                    return false
                                }
                            }
                        }
                    }

                    // WebChromeClient 설정 (JavaScript 다이얼로그, 파일 업로드 등)
                    webChromeClient = object : WebChromeClient() {
                        override fun onProgressChanged(view: WebView?, newProgress: Int) {
                            super.onProgressChanged(view, newProgress)
                            android.util.Log.d("WebViewScreen", "Progress: $newProgress%")
                            // 프로그레스가 100%가 되면 로딩 완료
                            if (newProgress == 100) {
                                isRefreshing = false
                                onLoadingChanged(false)
                            }
                        }

                        override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                            consoleMessage?.let {
                                android.util.Log.d(
                                    "WebViewConsole",
                                    "[${it.messageLevel()}] ${it.message()} - ${it.sourceId()}:${it.lineNumber()}"
                                )
                            }
                            return super.onConsoleMessage(consoleMessage)
                        }

                        override fun onJsAlert(
                            view: WebView?,
                            url: String?,
                            message: String?,
                            result: JsResult?
                        ): Boolean {
                            android.util.Log.d("WebViewScreen", "JS Alert: $message")
                            // JavaScript alert 처리
                            return super.onJsAlert(view, url, message, result)
                        }

                        override fun onJsConfirm(
                            view: WebView?,
                            url: String?,
                            message: String?,
                            result: JsResult?
                        ): Boolean {
                            android.util.Log.d("WebViewScreen", "JS Confirm: $message")
                            // JavaScript confirm 처리
                            return super.onJsConfirm(view, url, message, result)
                        }

                        // 파일 업로드 지원 (API 21+)
                        override fun onShowFileChooser(
                            webView: WebView?,
                            filePathCallback: ValueCallback<Array<Uri>>?,
                            fileChooserParams: FileChooserParams?
                        ): Boolean {
                            // 파일 선택 처리 (향후 구현 가능)
                            return super.onShowFileChooser(
                                webView,
                                filePathCallback,
                                fileChooserParams
                            )
                        }
                    }

                    // URL 로드
                    loadUrl(url)
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // 로딩 인디케이터
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f)
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(
                            color = MaterialTheme.colorScheme.primary
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "페이지 로딩중...",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }
        
        // PullToRefresh 인디케이터
        PullToRefreshContainer(
            modifier = Modifier.align(Alignment.TopCenter),
            state = pullToRefreshState,
        )
    }
}

/**
 * WebView 상태를 관리하는 헬퍼 함수들
 */
object WebViewHelper {
    fun canGoBack(webView: WebView?): Boolean {
        return webView?.canGoBack() ?: false
    }

    fun goBack(webView: WebView?) {
        webView?.goBack()
    }

    fun reload(webView: WebView?) {
        webView?.reload()
    }

    fun clearCache(webView: WebView?) {
        webView?.clearCache(true)
    }

    fun clearHistory(webView: WebView?) {
        webView?.clearHistory()
    }
}