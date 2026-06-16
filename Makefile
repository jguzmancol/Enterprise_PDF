.PHONY: up down build test lint frontend-lint backend-lint

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

test:
	docker compose run --rm backend python -m pytest tests/ -v

backend-lint:
	docker compose run --rm backend ruff check .

frontend-lint:
	cd frontend && npx eslint src/

lint: backend-lint frontend-lint

logs:
	docker compose logs -f

restart:
	docker compose restart
