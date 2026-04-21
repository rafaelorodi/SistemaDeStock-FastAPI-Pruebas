FROM python:3.11-slim

WORKDIR /code

# Instalamos dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiamos e instalamos dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos todo el contenido de la carpeta backend
COPY . .

# EXTREMADAMENTE IMPORTANTE: 
# Como main.py está dentro de app/, usamos app.main:app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]