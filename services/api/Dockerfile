FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 DATA_DIR=/app/.local
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN useradd --create-home --uid 10001 creator && mkdir -p /app/.local && chown creator /app/.local
COPY creatorai ./creatorai
COPY migrations ./migrations
COPY alembic.ini ./alembic.ini
USER creator
EXPOSE 8000
CMD ["sh", "-c", "python -m creatorai.migrate && exec uvicorn creatorai.main:create_app --factory --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
