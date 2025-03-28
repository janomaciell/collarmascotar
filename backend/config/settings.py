"""
Django settings for pet_qr project.

Generated by 'django-admin startproject' using Django 5.1.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

from pathlib import Path
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = [
    'collarmascotar.onrender.com',
    'collarmascotar.vercel.app', 
    'localhost', 
    '127.0.0.1',
]

                


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'pet_qr_db',          # Nombre de tu base de datos
        'USER': 'root',               # Tu usuario de MySQL
        'PASSWORD': '1234',     # Tu contraseña de MySQL
        'HOST': 'localhost',          # Host donde está tu MySQL
        'PORT': '3306',              # Puerto por defecto de MySQL
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4'  # Añade esto para mejor soporte de caracteres
        }
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Configuración para desarrollo
CORS_ALLOW_ALL_ORIGINS = True  # En producción, especificar orígenes

# Configuración de REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # Cambia según tu proveedor
EMAIL_PORT = 587
EMAIL_USE_SSL=False
EMAIL_USE_TLS=True
EMAIL_HOST_USER = 'janomaciel1@gmail.com'  # Tu email
EMAIL_HOST_PASSWORD = 'hcfmtsyiqpntlrkp'  # Contraseña o contraseña de aplicación
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER


# Configuración de Firebase Admin SDK
FIREBASE_CREDENTIALS_PATH = BASE_DIR / 'credentials' / 'firebase-adminsdk.json'

# Configuración para Web Push
WEBPUSH_SETTINGS = {
    "VAPID_PUBLIC_KEY": "BGv-Zb95k8vUG0_p4JHfQoXouhg2PwRP97C2mTWC2jei4zrkP2k48Ui1xYNoSSvfbdcubaCo8q4DALd3kjzABc0",
    "VAPID_PRIVATE_KEY": "514n-moA8np5wm5HVfhtx3ESytwVqozEkCI1WGqCBNs",
    "VAPID_ADMIN_EMAIL": "janomaciel1@gmail.com"
}

REACT_APP_API_URL = config('API_URL', default='http://localhost:8000/api')

CORS_ALLOWED_ORIGINS = [
    "https://collarmascotar.onrender.com",
    "http://localhost:3000",
    "https://collarmascotar.vercel.app",
    "http://localhost:8000"
]

API_URL=config('API_URL')
FRONTEND_URL=config('FRONTEND_URL')
