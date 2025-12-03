#!/usr/bin/env python3
"""
SQLite to PostgreSQL Migration Script

This script migrates data from the SQLite database to PostgreSQL.
Run this AFTER docker-compose up when migrating from SQLite to PostgreSQL.

Usage:
    # From inside the backend container:
    docker exec -it linker_backend python migrate_sqlite_to_postgres.py
    
    # Or from local machine with both databases accessible:
    python migrate_sqlite_to_postgres.py
"""

import os
import sqlite3
import sys

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

# Configuration
SQLITE_DB_PATH = os.environ.get('SQLITE_DB_PATH', 'instance/fabric_sourcing.db')
POSTGRES_URL = os.environ.get('DATABASE_URL', 'postgresql://linker:linker_secure_password@postgres:5432/linker_db')


def parse_postgres_url(url):
    """Parse PostgreSQL URL into connection parameters."""
    # Format: postgresql://user:password@host:port/database
    url = url.replace('postgresql://', '')
    user_pass, host_db = url.split('@')
    user, password = user_pass.split(':')
    host_port, database = host_db.split('/')
    
    if ':' in host_port:
        host, port = host_port.split(':')
        port = int(port)
    else:
        host = host_port
        port = 5432
    
    return {
        'user': user,
        'password': password,
        'host': host,
        'port': port,
        'database': database
    }


def get_sqlite_tables(cursor):
    """Get list of tables in SQLite database."""
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    return [row[0] for row in cursor.fetchall()]


def get_table_columns(cursor, table_name, is_postgres=False):
    """Get column names for a table."""
    if is_postgres:
        cursor.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}';")
        return [row[0] for row in cursor.fetchall()]
    else:
        cursor.execute(f"PRAGMA table_info({table_name});")
        return [row[1] for row in cursor.fetchall()]


def migrate_table(sqlite_cursor, pg_cursor, table_name):
    """Migrate a single table from SQLite to PostgreSQL."""
    print(f"\n  Migrating table: {table_name}")
    
    # Get columns from SQLite
    columns = get_table_columns(sqlite_cursor, table_name, is_postgres=False)
    print(f"    Columns: {columns}")
    
    # Fetch all data from SQLite
    sqlite_cursor.execute(f"SELECT * FROM {table_name}")
    rows = sqlite_cursor.fetchall()
    print(f"    Found {len(rows)} rows")
    
    if not rows:
        print(f"    Skipping empty table")
        return 0
    
    # Clear existing data in PostgreSQL (optional, comment out if you want to append)
    try:
        pg_cursor.execute(f"TRUNCATE TABLE {table_name} CASCADE;")
        print(f"    Cleared existing PostgreSQL data")
    except Exception as e:
        print(f"    Note: Could not truncate (table might not exist yet): {e}")
    
    # Insert data into PostgreSQL
    columns_str = ', '.join(columns)
    placeholders = ', '.join(['%s'] * len(columns))
    
    insert_query = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"
    
    try:
        for row in rows:
            pg_cursor.execute(insert_query, row)
        print(f"    Inserted {len(rows)} rows successfully")
        return len(rows)
    except Exception as e:
        print(f"    ERROR inserting data: {e}")
        raise


def reset_sequences(pg_cursor, table_name):
    """Reset PostgreSQL sequence for auto-increment columns."""
    try:
        # Get the max ID and reset the sequence
        pg_cursor.execute(f"""
            SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), 
                   COALESCE((SELECT MAX(id) FROM {table_name}), 1), 
                   true);
        """)
        print(f"    Reset sequence for {table_name}")
    except Exception as e:
        print(f"    Note: Could not reset sequence for {table_name}: {e}")


def main():
    print("=" * 60)
    print("SQLite to PostgreSQL Migration")
    print("=" * 60)
    
    # Check if SQLite database exists
    if not os.path.exists(SQLITE_DB_PATH):
        print(f"\nERROR: SQLite database not found at: {SQLITE_DB_PATH}")
        print("Make sure the instance/fabric_sourcing.db file exists.")
        sys.exit(1)
    
    print(f"\nSource: {SQLITE_DB_PATH}")
    print(f"Target: {POSTGRES_URL.replace(POSTGRES_URL.split(':')[2].split('@')[0], '****')}")  # Hide password
    
    # Connect to SQLite
    print("\n[1/4] Connecting to SQLite...")
    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    sqlite_cursor = sqlite_conn.cursor()
    
    # Connect to PostgreSQL
    print("[2/4] Connecting to PostgreSQL...")
    try:
        pg_params = parse_postgres_url(POSTGRES_URL)
        pg_conn = psycopg2.connect(**pg_params)
        pg_conn.autocommit = False
        pg_cursor = pg_conn.cursor()
        print("    Connected successfully!")
    except Exception as e:
        print(f"    ERROR: Could not connect to PostgreSQL: {e}")
        print("\n    Make sure:")
        print("    1. PostgreSQL container is running (docker-compose up -d)")
        print("    2. DATABASE_URL environment variable is correct")
        sys.exit(1)
    
    # Get tables to migrate
    print("[3/4] Discovering tables...")
    tables = get_sqlite_tables(sqlite_cursor)
    print(f"    Found tables: {tables}")
    
    # Tables to migrate (in order due to foreign key constraints)
    migration_order = ['user', 'fabric']  # Add more tables as needed
    tables_to_migrate = [t for t in migration_order if t in tables]
    
    # Add any remaining tables not in our explicit order
    for t in tables:
        if t not in tables_to_migrate and t != 'alembic_version':
            tables_to_migrate.append(t)
    
    print(f"    Migration order: {tables_to_migrate}")
    
    # Migrate each table
    print("[4/4] Migrating data...")
    total_rows = 0
    
    try:
        for table in tables_to_migrate:
            rows = migrate_table(sqlite_cursor, pg_cursor, table)
            total_rows += rows
            reset_sequences(pg_cursor, table)
        
        # Commit the transaction
        pg_conn.commit()
        print(f"\n{'=' * 60}")
        print(f"Migration completed successfully!")
        print(f"Total rows migrated: {total_rows}")
        print(f"{'=' * 60}")
        
    except Exception as e:
        print(f"\nERROR: Migration failed: {e}")
        pg_conn.rollback()
        print("Transaction rolled back. No data was changed.")
        sys.exit(1)
    
    finally:
        sqlite_cursor.close()
        sqlite_conn.close()
        pg_cursor.close()
        pg_conn.close()


if __name__ == '__main__':
    main()

