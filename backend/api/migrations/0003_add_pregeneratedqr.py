from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),  # Ajusta este número según tu última migración
    ]

    operations = [
        migrations.CreateModel(
            name='PreGeneratedQR',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('qr_uuid', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('qr_code', models.ImageField(blank=True, upload_to='pre_generated_qr_codes/')),
                ('is_assigned', models.BooleanField(default=False)),
                ('is_printed', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]