.PHONY: help install dev build start stop clean

help:
	@echo "AI Code Reviewer - Makefile Commands"
	@echo ""
	@echo "  make install    - Install all dependencies"
	@echo "  make dev        - Start development servers"
	@echo "  make build      - Build for production"
	@echo "  make start      - Start production servers"
	@echo "  make stop       - Stop all services"
	@echo "  make clean      - Clean all build artifacts"
	@echo "  make docker-up  - Start with Docker Compose"
	@echo "  make docker-down - Stop Docker Compose"

install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Done!"

dev:
	@echo "Starting development servers..."
	@make -j2 dev-backend dev-frontend

dev-backend:
	cd backend && npm run start:dev

dev-frontend:
	cd frontend && npm run dev

build:
	@echo "Building backend..."
	cd backend && npm run build
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "Done!"

start:
	@echo "Starting production servers..."
	@make -j2 start-backend start-frontend

start-backend:
	cd backend && npm run start:prod

start-frontend:
	cd frontend && npm run start

docker-up:
	docker-compose up -d
	@echo "Services started!"
	@echo "Backend: http://localhost:3001"
	@echo "Frontend: http://localhost:3000"

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/dist
	rm -rf frontend/.next
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	@echo "Done!"
