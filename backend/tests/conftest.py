import os

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://jobhunting:jobhunting_dev@localhost:5432/jobhunting")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
