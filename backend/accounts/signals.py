from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@receiver(pre_save, sender=User)
def sync_user_permissions_on_role_change(sender, instance, **kwargs):
    """
    사용자 역할이 변경될 때 권한을 자동으로 동기화합니다.
    """
    # 새로 생성되는 경우는 제외
    if instance.pk is None:
        return
    
    try:
        # 기존 사용자 정보 가져오기
        old_instance = User.objects.get(pk=instance.pk)
        
        # 역할이 변경되었는지 확인
        if old_instance.role != instance.role:
            logger.info(f"사용자 {instance.phone}의 역할이 {old_instance.role} → {instance.role}로 변경됨")
            
            # 역할에 따른 권한 설정
            if instance.role == 'ADMIN':
                instance.is_staff = True
                instance.is_superuser = True
                instance.is_store_owner = False
                logger.info(f"관리자 권한 설정: {instance.phone}")
                
            elif instance.role == 'STORE_OWNER':
                instance.is_staff = True
                instance.is_superuser = False
                instance.is_store_owner = True
                logger.info(f"매장 관리자 권한 설정: {instance.phone}")
                
            else:  # USER, GUEST
                instance.is_staff = False
                instance.is_superuser = False
                instance.is_store_owner = False
                logger.info(f"일반 사용자 권한 설정: {instance.phone}")
                
    except User.DoesNotExist:
        # 사용자가 존재하지 않는 경우 (새 생성 등)
        pass
    except Exception as e:
        logger.error(f"사용자 권한 동기화 중 오류 발생: {e}")

@receiver(post_save, sender=User)
def log_user_creation(sender, instance, created, **kwargs):
    """
    새 사용자가 생성될 때 로그를 남깁니다.
    """
    if created:
        logger.info(f"새 사용자 생성: {instance.phone} ({instance.get_role_display()})")
        
        # 새 사용자의 경우에도 역할에 맞는 권한 설정
        if instance.role == 'ADMIN':
            if not (instance.is_staff and instance.is_superuser):
                User.objects.filter(pk=instance.pk).update(
                    is_staff=True,
                    is_superuser=True,
                    is_store_owner=False
                )
                logger.info(f"새 관리자 권한 설정: {instance.phone}")
                
        elif instance.role == 'STORE_OWNER':
            if not (instance.is_staff and instance.is_store_owner):
                User.objects.filter(pk=instance.pk).update(
                    is_staff=True,
                    is_superuser=False,
                    is_store_owner=True
                )
                logger.info(f"새 매장 관리자 권한 설정: {instance.phone}")
                
        else:  # USER, GUEST
            if instance.is_staff or instance.is_superuser or instance.is_store_owner:
                User.objects.filter(pk=instance.pk).update(
                    is_staff=False,
                    is_superuser=False,
                    is_store_owner=False
                )
                logger.info(f"새 일반 사용자 권한 설정: {instance.phone}") 