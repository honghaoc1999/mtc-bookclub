# Generated by Django 3.2.9 on 2021-11-08 05:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookclub', '0005_auto_20211108_0335'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='access_role',
            field=models.CharField(default='regular user', max_length=200),
        ),
    ]
