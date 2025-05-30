# Generated by Django 4.2.7 on 2025-04-23 10:15

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Store',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='매장명')),
                ('address', models.CharField(max_length=200, verbose_name='주소')),
                ('description', models.TextField(verbose_name='매장 설명')),
                ('image', models.ImageField(upload_to='store_images/', verbose_name='매장 이미지')),
                ('status', models.CharField(choices=[('ACTIVE', '운영중'), ('INACTIVE', '휴업중'), ('CLOSED', '폐업')], default='ACTIVE', max_length=20)),
                ('latitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('longitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stores', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': '매장',
                'verbose_name_plural': '매장들',
                'db_table': 'stores',
            },
        ),
        migrations.CreateModel(
            name='Banner',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='banner_images/', verbose_name='배너 이미지')),
                ('title', models.CharField(max_length=100, verbose_name='배너 제목')),
                ('description', models.TextField(blank=True, null=True, verbose_name='배너 설명')),
                ('start_date', models.DateTimeField(verbose_name='시작일')),
                ('end_date', models.DateTimeField(verbose_name='종료일')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('store', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='banners', to='stores.store')),
            ],
            options={
                'verbose_name': '배너',
                'verbose_name_plural': '배너들',
                'db_table': 'banners',
            },
        ),
    ]
