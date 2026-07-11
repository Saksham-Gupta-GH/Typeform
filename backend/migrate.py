import sqlite3
import os

DB_PATH = "./typeform_clone.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print("Database not found, skipping migration.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if user_id column already exists
        cursor.execute("PRAGMA table_info(forms)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "user_id" not in columns:
            print("Adding user_id column to forms table...")
            cursor.execute("ALTER TABLE forms ADD COLUMN user_id INTEGER REFERENCES users(id)")
            conn.commit()
            print("Migration successful.")
        else:
            print("user_id column already exists.")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
