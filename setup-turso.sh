#!/bin/bash

echo "🚀 Turso Database Setup Helper"
echo "==============================="
echo ""

# Check if Turso CLI is installed
if ! command -v turso &> /dev/null; then
    echo "❌ Turso CLI not found. Installing..."
    curl -sSfL https://get.tur.so/install.sh | bash
    echo "✅ Turso CLI installed. Please restart your terminal and run this script again."
    exit 1
fi

echo "✅ Turso CLI found"
echo ""

# Check if user is logged in
if ! turso auth whoami &> /dev/null; then
    echo "🔐 Please log in to Turso:"
    turso auth login
    echo ""
fi

echo "👤 Logged in as: $(turso auth whoami)"
echo ""

# Check if database exists
DB_NAME="washing-machine-db"
if turso db show "$DB_NAME" &> /dev/null; then
    echo "✅ Database '$DB_NAME' already exists"
else
    echo "📦 Creating database '$DB_NAME'..."
    turso db create "$DB_NAME"
    echo "✅ Database created successfully"
fi

echo ""
echo "🔗 Getting database URL..."
DB_URL=$(turso db show "$DB_NAME" --url)
echo "Database URL: $DB_URL"

echo ""
echo "🔑 Creating auth token..."
AUTH_TOKEN=$(turso db tokens create "$DB_NAME")
echo "Auth Token: $AUTH_TOKEN"

echo ""
echo "📝 Updating .env file..."
cd api

# Update .env file
cat > .env << EOF
# Turso Database Configuration
TURSO_DATABASE_URL=$DB_URL
TURSO_AUTH_TOKEN=$AUTH_TOKEN

# Server Configuration
NODE_ENV=development
PORT=3002
EOF

echo "✅ Environment file updated!"
echo ""
echo "🎉 Turso setup complete!"
echo "You can now start your server with:"
echo "  cd api && npm start"
echo ""
echo "🌐 Your database is accessible at:"
echo "  $DB_URL" 