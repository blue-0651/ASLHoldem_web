# Generated by Django 4.2.7 on 2025-04-24 12:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tournaments', '0003_add_max_seats'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='tournament',
            name='max_players',
        ),
        migrations.AlterField(
            model_name='tournament',
            name='max_seats',
            field=models.IntegerField(verbose_name='총 좌석권 수량'),
        ),
    ]
