package com.asl.holdem.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/**
 * ASL Holdem 라이트 컬러 스킴
 */
private val LightColorScheme = lightColorScheme(
    primary = ASLPrimary,
    onPrimary = ASLOnPrimary,
    primaryContainer = ASLPrimaryContainer,
    onPrimaryContainer = ASLOnPrimaryContainer,
    secondary = ASLSecondary,
    onSecondary = ASLOnSecondary,
    secondaryContainer = ASLSecondaryContainer,
    onSecondaryContainer = ASLOnSecondaryContainer,
    tertiary = ASLTertiary,
    onTertiary = ASLOnTertiary,
    tertiaryContainer = ASLTertiaryContainer,
    onTertiaryContainer = ASLOnTertiaryContainer,
    error = ASLError,
    errorContainer = ASLErrorContainer,
    onError = ASLOnError,
    onErrorContainer = ASLOnErrorContainer,
    background = ASLBackground,
    onBackground = ASLOnBackground,
    surface = ASLSurface,
    onSurface = ASLOnSurface,
    surfaceVariant = ASLSurfaceVariant,
    onSurfaceVariant = ASLOnSurfaceVariant,
    outline = ASLOutline,
    inverseOnSurface = ASLInverseOnSurface,
    inverseSurface = ASLInverseSurface,
    inversePrimary = ASLInversePrimary,
    surfaceTint = ASLSurfaceTint,
    outlineVariant = ASLOutlineVariant,
    scrim = ASLScrim,
)

/**
 * ASL Holdem 다크 컬러 스킴
 */
private val DarkColorScheme = darkColorScheme(
    primary = ASLPrimaryDark,
    onPrimary = ASLOnPrimaryDark,
    primaryContainer = ASLPrimaryContainerDark,
    onPrimaryContainer = ASLOnPrimaryContainerDark,
    secondary = ASLSecondaryDark,
    onSecondary = ASLOnSecondaryDark,
    secondaryContainer = ASLSecondaryContainerDark,
    onSecondaryContainer = ASLOnSecondaryContainerDark,
    tertiary = ASLTertiaryDark,
    onTertiary = ASLOnTertiaryDark,
    tertiaryContainer = ASLTertiaryContainerDark,
    onTertiaryContainer = ASLOnTertiaryContainerDark,
    error = ASLErrorDark,
    errorContainer = ASLErrorContainerDark,
    onError = ASLOnErrorDark,
    onErrorContainer = ASLOnErrorContainerDark,
    background = ASLBackgroundDark,
    onBackground = ASLOnBackgroundDark,
    surface = ASLSurfaceDark,
    onSurface = ASLOnSurfaceDark,
    surfaceVariant = ASLSurfaceVariantDark,
    onSurfaceVariant = ASLOnSurfaceVariantDark,
    outline = ASLOutlineDark,
    inverseOnSurface = ASLInverseOnSurfaceDark,
    inverseSurface = ASLInverseSurfaceDark,
    inversePrimary = ASLInversePrimaryDark,
    surfaceTint = ASLSurfaceTintDark,
    outlineVariant = ASLOutlineVariantDark,
    scrim = ASLScrimDark,
)

/**
 * ASL Holdem 앱 테마
 */
@Composable
fun ASLHoldemTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color는 Android 12+에서 사용 가능
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}