#!/bin/bash
# Quick verification script to check if everything is set up correctly

echo "=== Typeform Clone Setup Verification ==="
echo ""

# Check 1: Python venv
echo "✓ Checking Python virtual environment..."
if [ -d "venv" ]; then
    echo "  ✓ venv folder found"
else
    echo "  ✗ venv not found - run: python3 -m venv venv"
fi

# Check 2: Database
echo ""
echo "✓ Checking database..."
if [ -f "typeform_clone.db" ]; then
    echo "  ✓ typeform_clone.db found"
    # Check for description column
    if command -v sqlite3 &> /dev/null; then
        if sqlite3 typeform_clone.db "PRAGMA table_info(forms);" | grep -q "description"; then
            echo "  ✓ description column exists"
        else
            echo "  ✗ description column missing - run: python3 migrate_db.py"
        fi
    fi
else
    echo "  ✗ typeform_clone.db not found (will be created on first run)"
fi

# Check 3: Requirements
echo ""
echo "✓ Checking requirements..."
if [ -f "requirements.txt" ]; then
    echo "  ✓ requirements.txt found"
else
    echo "  ✗ requirements.txt not found"
fi

# Check 4: Backend port
echo ""
echo "✓ Checking if port 8000 is available..."
if command -v lsof &> /dev/null; then
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
        echo "  ⚠ Port 8000 already in use - kill with: lsof -ti:8000 | xargs kill -9"
    else
        echo "  ✓ Port 8000 is available"
    fi
fi

# Check 5: Git
echo ""
echo "✓ Checking git..."
if git status &> /dev/null; then
    echo "  ✓ Git repository found"
    echo "  Latest commit: $(git log -1 --oneline)"
else
    echo "  ✗ Not a git repository"
fi

echo ""
echo "=== Setup Verification Complete ==="
echo ""
echo "To start the backend:"
echo "  1. source venv/bin/activate"
echo "  2. pip install -r requirements.txt"
echo "  3. python3 migrate_db.py"
echo "  4. uvicorn main:app --reload"
