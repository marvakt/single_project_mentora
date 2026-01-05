import os

from dotenv import load_dotenv

load_dotenv()

print("DB_NAME:", os.environ.get("DB_NAME"))
print("DB_USER:", os.environ.get("DB_USER"))
print("DB_PASSWORD:", os.environ.get("DB_PASSWORD"))
print("DB_HOST:", os.environ.get("DB_HOST"))
