from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from flask_login import UserMixin
from bson import ObjectId

bcrypt = Bcrypt()

class Database:
    client = None
    db = None

    @staticmethod
    def initialize(uri):
        Database.client = MongoClient(uri)
        try:
            Database.db = Database.client.get_default_database()
            if Database.db is None:
                Database.db = Database.client['vaani']
        except Exception:
            Database.db = Database.client['vaani']
        
        # Ensure Indexes for Speed
        Database.db.messages.create_index([('sender_id', 1), ('receiver_id', 1), ('timestamp', -1)])
        Database.db.users.create_index('username', unique=True)
        Database.db.users.create_index('email', unique=True)

class User(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data['_id'])
        self.username = user_data['username']
        self.email = user_data['email']
        self.profile_pic = user_data.get('profile_pic', 'default.png')
        self.about = user_data.get('about', 'Available')
        self.connections = user_data.get('connections', [])
        self.requests_received = user_data.get('requests_received', [])
        self.requests_sent = user_data.get('requests_sent', [])
        self.online = user_data.get('online', False)

    @staticmethod
    def find_by_username(username):
        user_data = Database.db.users.find_one({'username': username})
        return User(user_data) if user_data else None

    @staticmethod
    def find_by_id(user_id):
        user_data = Database.db.users.find_one({'_id': ObjectId(user_id)})
        return User(user_data) if user_data else None

    @staticmethod
    def create_user(username, email, password):
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        user_data = {
            'username': username,
            'email': email,
            'password': hashed_password,
            'profile_pic': f"https://ui-avatars.com/api/?name={username}&background=random",
            'about': 'Available',
            'online': False,
            'last_seen': None
        }
        return Database.db.users.insert_one(user_data)

    @staticmethod
    def verify_password(stored_password, provided_password):
        return bcrypt.check_password_hash(stored_password, provided_password)
