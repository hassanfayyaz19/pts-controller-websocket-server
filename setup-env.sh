#!/bin/bash

echo "PTS Controller WebSocket Server Environment Setup"
echo "================================================"
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. .env file unchanged."
        exit 0
    fi
fi

# Copy env.example to .env
if [ -f "env.example" ]; then
    cp env.example .env
    echo "✅ Created .env file from env.example"
    echo ""
    echo "📝 Next steps:"
    echo "1. Edit .env file with your specific values"
    echo "2. At minimum, update these values:"
    echo "   - PORT (if not using default 3000)"
    echo "   - HOST (if not using default 0.0.0.0)"
    echo "   - LOG_LEVEL (debug/info/warn/error)"
    echo ""
    echo "3. For production, consider setting:"
    echo "   - NODE_ENV=production"
    echo "   - ENABLE_AUTH=true"
    echo "   - JWT_SECRET=your-secure-secret"
    echo "   - ENABLE_HTTPS=true (if using SSL)"
    echo ""
    echo "🔧 You can now start the server with: npm start"
else
    echo "❌ env.example file not found!"
    echo "Please ensure env.example exists in the current directory."
    exit 1
fi 