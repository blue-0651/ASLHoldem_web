# Generated by Django 4.2.7 on 2025-06-21 08:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tournaments', '0012_alter_tournamentplayer_unique_together_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='tournament',
            name='end_time',
            field=models.DateTimeField(blank=True, null=True, verbose_name='종료 시간'),
        ),
    ]
