# Generated by Django 4.2.7 on 2025-04-24 10:32

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='phone',
            field=models.CharField(blank=True, max_length=13, null=True, unique=True, validators=[django.core.validators.RegexValidator(message="전화번호는 '010-1234-5678' 형식으로 입력해주세요.", regex='^\\d{3}-\\d{4}-\\d{4}$')]),
        ),
    ]
