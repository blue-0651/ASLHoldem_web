package com.asl.holdem

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * ASL Holdem 애플리케이션 클래스
 * Hilt 의존성 주입을 위한 기본 설정
 */
@HiltAndroidApp
class ASLApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
    }
}