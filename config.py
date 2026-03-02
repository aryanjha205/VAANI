import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'vaani-secret-key-12345'
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/vaani'
    # Email Configuration
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 465)
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'True') == 'True'
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'False') == 'True'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME') or 'bharatbyte.com@gmail.com'
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD') or 'tueqcmqvisceqwuf'
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_USERNAME') or 'bharatbyte.com@gmail.com'
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'static/uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload
