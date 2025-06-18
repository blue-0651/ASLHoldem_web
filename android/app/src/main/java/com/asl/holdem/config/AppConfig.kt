package com.asl.holdem.config

import com.asl.holdem.BuildConfig

/**
 * 앱 설정 관리 클래스
 * BuildConfig의 값들을 편리하게 사용할 수 있도록 도와줍니다.
 */
object AppConfig {
    
    // 서버 URL 설정
  //  const val BASE_URL = BuildConfig.BASE_URL
 //   const val API_URL = BuildConfig.API_URL
    const val BASE_URL = "http://172.30.1.81:3000"
    //const val API_URL = "http://192.168.0.185:8000"

    const val BUILD_TYPE = BuildConfig.BUILD_TYPE
    
    /**
     * 현재 빌드 환경 확인
     */
    fun isDebugBuild(): Boolean = BuildConfig.DEBUG
    fun isReleaseBuild(): Boolean = BUILD_TYPE == "release"

} 