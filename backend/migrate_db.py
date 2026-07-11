#!/usr/bin/env python3
"""
Database migration script - Adds missing columns to existing database.
Run this once if you get schema errors.
"""
import sqlite3
import os

DB_PATH = "typeform_clone.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"✓ Database does not exist yet (will be created on first run)")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if description column exists on forms table
        cursor.execute("PRAGMA table_info(forms)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "description" not in columns:
            print("Adding 'description' column to forms table...")
            cursor.execute("ALTER TABLE forms ADD COLUMN description VARCHAR")
            conn.commit()
            print("✓ Migration complete!")
        else:
            print("✓ Database schema is already up to date")
            
    except sqlite3.OperationalError as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
