# Generated by Django 3.2.9 on 2021-11-20 07:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookclub', '0006_profile_access_role'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='book_title',
            field=models.CharField(default='Great Gatsby', max_length=200),
        ),
        migrations.AlterField(
            model_name='room',
            name='book_title',
            field=models.CharField(max_length=50, unique=True),
        ),
    ]
