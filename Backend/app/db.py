import os
from contextlib import contextmanager
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row

_pool = None

def init_db_pool():
    global _pool
    if _pool is None:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise RuntimeError("DATABASE_URL is not set. Copy .env.example to .env and configure PostgreSQL.")
        _pool = ConnectionPool(
            conninfo=database_url,
            min_size=1,
            max_size=10,
            kwargs={"row_factory": dict_row},
            open=True,
        )

@contextmanager
def get_db():
    if _pool is None:
        init_db_pool()
    with _pool.connection() as conn:
        yield conn
