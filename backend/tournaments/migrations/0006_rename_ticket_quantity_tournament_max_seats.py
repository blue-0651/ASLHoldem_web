# Generated by Django 4.2.7 on 2025-05-02 04:55

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tournaments', '0005_remove_tournament_max_seats_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='tournament',
            old_name='ticket_quantity',
            new_name='max_seats',
        ),
    ]
