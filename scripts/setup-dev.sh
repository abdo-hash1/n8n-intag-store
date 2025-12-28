#!/bin/bash

# ===========================================
# n8n SaaS Platform - Development Setup Script
# ===========================================

echo "🚀 n8n SaaS Platform - Development Setup"
echo "========================================="
echo ""

# Check for required tools
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
    echo "✓ $1 is installed"
}

echo "Checking required tools..."
check_command node
check_command npm
check_command docker

echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "⚙️ Setting up environment files..."
cd ../backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created backend/.env from .env.example"
    echo "⚠️ Please edit backend/.env with your database credentials!"
else
    echo "✓ backend/.env already exists"
fi

cd ../frontend
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✓ Created frontend/.env.local from .env.example"
else
    echo "✓ frontend/.env.local already exists"
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "========================================="
echo "Next steps:"
echo "1. Configure backend/.env with your PostgreSQL database URL"
echo "2. Run database migrations: cd backend && npx prisma migrate dev"
echo "3. Seed the database: cd backend && npm run prisma:seed"
echo "4. Start the backend: cd backend && npm run dev"
echo "5. Start the frontend: cd frontend && npm run dev"
echo ""
echo "Default credentials after seeding:"
echo "  Admin: admin@n8nsaas.com / Admin@123456"
echo "  User:  test@example.com / User@123456"
echo "========================================="
