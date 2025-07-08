from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'
    verbose_name = '사용자 관리'

    def ready(self):
        """앱이 로드될 때 시그널을 임포트합니다."""
        try:
            import accounts.signals  # noqa F401
        except ImportError:
            pass 