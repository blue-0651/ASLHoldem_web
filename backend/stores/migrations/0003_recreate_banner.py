# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('stores', '0002_store_close_time_store_manager_name_and_more'),
    ]

    operations = [
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