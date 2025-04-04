# Generated by Django 5.1.6 on 2025-03-31 04:46

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='postershare',
            options={},
        ),
        migrations.RemoveField(
            model_name='postershare',
            name='updated_at',
        ),
        migrations.AddField(
            model_name='postershare',
            name='image',
            field=models.ImageField(default=django.utils.timezone.now, upload_to='lost_posters/'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='postershare',
            name='pdf_file',
            field=models.FileField(blank=True, null=True, upload_to='lost_posters/pdf/'),
        ),
        migrations.AlterField(
            model_name='postershare',
            name='pet',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='posters', to='api.pet'),
        ),
    ]
