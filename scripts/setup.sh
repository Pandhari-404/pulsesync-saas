#!/usr/bin/env bash
set -e

echo "================================================="
echo "⚡ Bootstrapping PulseSync Full-Stack SaaS"
echo "================================================="

# Server setup
echo -e "\n[1/3] Setting up Server dependencies and database..."
cd "$(dirname "$0")/../server"
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed

# Client setup
echo -e "\n[2/3] Setting up Client dependencies..."
cd "../client"
npm install

echo -e "\n[3/3] Build complete!"
echo -e "\nTo start development servers:"
echo -e "  Terminal 1: cd server && npm run dev"
echo -e "  Terminal 2: cd client && npm run dev"
echo -e "\nOpen http://localhost:5173 to test drive PulseSync!"
