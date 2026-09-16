Deployment quickstart (Docker Compose)

1) Create a production environment file by copying the example and editing secrets:

```bash
cp .env.example .env.prod
# Edit .env.prod: set JWT_SECRET to a secure random value, DEFAULT_ADMIN_PASSWORD to a secure pass, FRONTEND_URL, etc.
```

2) Build and run with Docker Compose (production):

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

3) Verify services and healthcheck:

```bash
docker ps
docker logs samsara_pulse_app
docker inspect --format='{{json .State.Health}}' samsara_pulse_app
curl http://localhost:8085/health
```

Notes & recommendations

- Use a reverse proxy (nginx, Traefik) in front of the container to terminate TLS (Let's Encrypt) and host multiple services. Map the frontend to `/` and proxy API requests to `http://127.0.0.1:8085`.
- Store secrets in a secrets manager (Docker secrets, HashiCorp Vault, cloud provider secret store) — do not commit `.env.prod` to source control.
- For production scale and reliability, replace the SQLite file with a managed PostgreSQL instance and update `config.get_db_path()` accordingly.
- Consider moving `login_failures` and rate-limiting to Redis for multi-instance consistency.
- Add CI/CD pipeline to build images, run tests, and deploy to your chosen host (DigitalOcean, AWS ECS, Render, etc.).
 - For production scale and reliability, use the provided Traefik reverse-proxy and PostgreSQL service in `docker-compose.prod.yml`.
 - Note: the application currently defaults to SQLite. Switching to PostgreSQL requires updating `server/config.py` and SQL compatibility (date functions / PRAGMA). If you want, I can port DB access to SQLAlchemy for cross-DB compatibility.
 - Consider moving `login_failures` and rate-limiting to Redis for multi-instance consistency.
 - CI/CD: a GitHub Actions workflow `./.github/workflows/docker-image.yml` is included to build and push container images to GitHub Container Registry. Configure repo secrets to enable publishing.
