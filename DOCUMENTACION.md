# Documentación del Proyecto: Sistema de Stock FastAPI - Pruebas QA

---

## 📋 Tabla de Contenidos

1. [¿Para qué sirve?](#para-qué-sirve)
2. [¿Qué hace?](#qué-hace)
3. [¿Cómo funciona?](#cómo-funciona)
4. [¿Qué se implementó?](#qué-se-implementó)
5. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
6. [Requisitos del Sistema](#requisitos-del-sistema)
7. [Instalación y Configuración](#instalación-y-configuración)
8. [Guía de Uso](#guía-de-uso)

---

## 🎯 ¿Para qué sirve?

**SistemaDeStock-FastAPI-Pruebas** es una aplicación web completa diseñada para gestionar el inventario y stock de productos en un almacén o depósito. 

**Casos de uso principales:**
- Administración centralizada de usuarios con diferentes roles y permisos
- Gestión de productos y categorías
- Control de entrada, salida y venta de productos
- Registro de auditoría completo de todas las operaciones (Kardex)
- Monitoreo de rendimiento de la API con Prometheus
- Pruebas de automatización y validación de APIs (QA)

---

## 🔧 ¿Qué hace?

### Funcionalidades Principales

#### 1. **Sistema de Autenticación y Autorización**
- Registro de nuevos usuarios
- Login con tokens JWT (JSON Web Tokens)
- 4 roles con permisos específicos:
  - **admin_usuarios**: Gestión de usuarios
  - **encargado_deposito**: Gestión de productos e inventario
  - **vendedor**: Realización de ventas
  - **auditoria**: Consulta de historial de movimientos

#### 2. **Gestión de Usuarios**
- Crear usuarios con contraseñas hasheadas (bcrypt)
- Actualizar datos de usuario
- Listar todos los usuarios (solo admin)
- Eliminar usuarios
- Control de acceso basado en roles

#### 3. **Gestión de Productos**
- Crear productos con información: nombre, categoría, descripción, precio, stock inicial
- Actualizar datos de productos (con justificación)
- Listar productos (con filtro opcional por categoría)
- Eliminar productos (con justificación)
- Todos los cambios quedan registrados en el Kardex

#### 4. **Control de Inventario (Kardex)**
- **Entrada de Stock**: Agregar cantidad a un producto
- **Salida de Stock**: Disminuir cantidad (requiere justificación)
- **Ventas**: Registro de productos vendidos
- **Modificaciones**: Cambios en datos del producto
- **Eliminaciones**: Registro de productos eliminados

#### 5. **Auditoria y Trazabilidad**
- Registro completo de cada operación (quién, qué, cuándo, por qué)
- Consulta de movimientos por producto
- Visualización del historial completo (solo rol auditoria)
- Justificación obligatoria en operaciones sensibles

#### 6. **Monitoreo de Rendimiento**
- Integración con Prometheus para métricas de la API
- Tracking de tiempos de respuesta
- Monitoreo de errores y solicitudes

---

## 🏗️ ¿Cómo funciona?

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                     USUARIO FINAL                            │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         FRONTEND (React + Vite)                      │   │
│  │  - Login                                             │   │
│  │  - Gestión de Usuarios                              │   │
│  │  - Gestión de Productos                             │   │
│  │  - Ventas y Movimientos                             │   │
│  │  - Auditoría y Reportes                             │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                HTTP/REST API
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                  BACKEND (FastAPI)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Endpoints                                       │  │
│  │  - /token (Login)                                    │  │
│  │  - /register (Registro)                              │  │
│  │  - /users (Gestión de usuarios)                      │  │
│  │  - /products (Gestión de productos)                  │  │
│  │  - /products/{id}/add_stock (Entrada)                │  │
│  │  - /products/{id}/remove_stock (Salida)              │  │
│  │  - /products/{id}/sell (Ventas)                      │  │
│  │  - /movements (Auditoría)                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Base de Datos (SQLite)                              │  │
│  │  - Tabla: users                                      │  │
│  │  - Tabla: products                                   │  │
│  │  - Tabla: movements (Kardex)                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              MONITOREO (Prometheus)                         │
│              Métricas y rendimiento de la API               │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Autenticación

1. Usuario se registra o hace login
2. Backend valida credenciales contra base de datos
3. Si es válido, se genera un token JWT
4. Cliente guarda el token y lo envía en cada solicitud
5. Backend valida el token y verifica el rol del usuario
6. Si tiene permisos, se ejecuta la operación

### Flujo de una Operación (Ejemplo: Venta)

```
1. Vendedor hace login → Obtiene token JWT
2. Vendedor solicita vender 5 unidades del producto ID=1
3. Backend verifica:
   - ¿Token válido? ✓
   - ¿Rol es "vendedor"? ✓
   - ¿Producto existe? ✓
   - ¿Stock suficiente? ✓
4. Backend ejecuta:
   - Reduce stock del producto
   - Crea registro en tabla "movements"
   - Guarda: product_id, user_id, tipo="VENTA", cantidad, fecha
5. Retorna confirmación al cliente
6. Cliente puede consultar Kardex para ver el historial
```

---

## ✨ ¿Qué se implementó?

### Backend (FastAPI - Python)

#### **Tecnologías Utilizadas:**
- `FastAPI`: Framework web de alto rendimiento
- `SQLAlchemy`: ORM para manejo de base de datos
- `SQLite`: Base de datos ligera
- `python-jose + cryptography`: Generación y validación de JWT
- `passlib + bcrypt`: Hasheado seguro de contraseñas
- `Prometheus FastAPI Instrumentator`: Monitoreo de métricas
- `Redis`: Caché (configurado)
- `Uvicorn`: Servidor ASGI

#### **Características Implementadas:**

1. **Sistema de Roles y Permisos (RBAC)**
   - 4 roles definidos con acceso diferenciado
   - Decoradores de autorización en cada endpoint
   - Validación en tiempo de ejecución

2. **Modelos de Datos**
   ```
   - User: id, username, hashed_password, is_active, rol
   - Product: id, name, category, description, price, stock
   - ProductMovement: id, product_id, user_id, movement_type, quantity, justification, date
   ```

3. **Endpoints Implementados:**
   
   | Método | Endpoint | Descripción | Rol |
   |--------|----------|-------------|-----|
   | POST | /register | Registrar nuevo usuario | Público |
   | POST | /token | Login y obtener JWT | Público |
   | GET | /users | Listar usuarios | admin_usuarios |
   | PUT | /users/{id} | Actualizar usuario | admin_usuarios |
   | DELETE | /users/{id} | Eliminar usuario | admin_usuarios |
   | GET | /products | Listar productos | Público |
   | POST | /products | Crear producto | encargado_deposito |
   | PUT | /products/{id} | Actualizar producto | encargado_deposito |
   | DELETE | /products/{id} | Eliminar producto | encargado_deposito |
   | POST | /products/{id}/add_stock | Agregar stock | encargado_deposito |
   | POST | /products/{id}/remove_stock | Disminuir stock | encargado_deposito |
   | POST | /products/{id}/sell | Registrar venta | vendedor |
   | GET | /products/{id}/movements | Ver movimientos de producto | auditoria/encargado_deposito |
   | GET | /movements | Ver todos los movimientos | auditoria |

4. **Seguridad**
   - Autenticación JWT
   - Contraseñas hasheadas con bcrypt
   - CORS habilitado para desarrollo
   - Validación de entrada con Pydantic
   - Manejo de errores HTTP apropiados

5. **Auditoría**
   - Registro automático de cada operación
   - Justificación obligatoria en cambios sensibles
   - Trazabilidad completa de quién, qué y cuándo

### Frontend (React + Vite)

#### **Tecnologías Utilizadas:**
- `React 19`: Framework de UI
- `Vite`: Bundler moderno y rápido
- `JavaScript/JSX`: Lenguaje de desarrollo

#### **Componentes Implementados:**

1. **Login.jsx**
   - Formulario de login/registro
   - Almacenamiento de token JWT
   - Redirección según rol del usuario

2. **AdminUsuarios.jsx**
   - Listado de usuarios (solo para admin)
   - Crear, editar y eliminar usuarios
   - Asignación de roles

3. **AdminProductos.jsx**
   - Gestión de productos
   - CRUD completo de productos
   - Filtrado por categoría

4. **VendedorView.jsx**
   - Interfaz para vendedores
   - Realizar ventas
   - Ver stock disponible

5. **AuditoriaView.jsx**
   - Visualización de todos los movimientos
   - Historial de operaciones
   - Filtros y búsqueda

6. **KardexModal.jsx**
   - Modal para ver detalles de movimientos
   - Información de entrada/salida de stock
   - Justificaciones y auditores

#### **Características:**
- Interfaz responsive
- Gestión de estado para autenticación
- Comunicación HTTP con backend
- Validación de formularios

### Infraestructura (Docker)

#### **Docker Compose**
- **Backend**: Container con API FastAPI en puerto 8001
- **Frontend**: Container con React/Vite en puerto 5173
- **Volúmenes**: Persistencia de base de datos SQLite
- **Networks**: Red interna `qa-monitoring` para Prometheus

#### **Configuración:**
- Base de datos SQLite persistente en `/code/data/qa_automation.db`
- Variables de entorno para DATABASE_URL
- Composición multi-servicio

### Características de QA y Testing

1. **Monitoreo con Prometheus**
   - Métricas de requests y responses
   - Tracking de tiempos de respuesta
   - Conteo de errores por tipo

2. **Stack de Prueba**
   - API lista para testing automático
   - Endpoints bien definidos para QA
   - Respuestas HTTP consistentes
   - Manejo de errores documentado

3. **Reproducibilidad**
   - Docker Compose para ambiente consistente
   - Datos iniciales configurables
   - Scripts de inicialización

---

## 📋 Requisitos del Sistema

### Mínimos:
- **CPU**: 2 cores
- **RAM**: 2GB
- **Disco**: 1GB
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Software:
- Docker Desktop (Windows/Mac) o Docker Engine (Linux)
- Git
- Browser moderno (Chrome, Firefox, Edge)

---

## 🚀 Instalación y Configuración

### Opción 1: Con Docker Compose (Recomendado)

```bash
# Clonar repositorio
git clone https://github.com/rafaelorodi/SistemaDeStock-FastAPI-Pruebas.git
cd SistemaDeStock-FastAPI-Pruebas

# Iniciar servicios
docker-compose up --build

# Acceder a la aplicación
# Frontend: http://localhost:5173
# API: http://localhost:8001
# Docs API: http://localhost:8001/docs
```

### Opción 2: Instalación Manual

#### Backend:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend:
```bash
cd frontend-qa
npm install
npm run dev
```

---

## 📖 Guía de Uso

### 1. Registro e Login

**Endpoint de Registro:**
```bash
curl -X POST "http://localhost:8001/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"usuario1\",
    \"password\": \"password123\",
    \"rol\": \"vendedor\"
  }"
```

**Endpoint de Login:**
```bash
curl -X POST "http://localhost:8001/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=usuario1&password=password123"

# Respuesta:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "bearer"
# }
```

### 2. Gestión de Productos

**Crear Producto (requiere rol: encargado_deposito):**
```bash
curl -X POST "http://localhost:8001/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_aqui>" \
  -d "{
    \"name\": \"Laptop Dell\",
    \"category\": \"Electrónica\",
    \"description\": \"Laptop de 15 pulgadas\",
    \"price\": 899.99,
    \"stock\": 10
  }"
```

**Listar Productos:**
```bash
curl -X GET "http://localhost:8001/products" \
  -H "Authorization: Bearer <token_aqui>"
```

**Listar por Categoría:**
```bash
curl -X GET "http://localhost:8001/products?category=Electrónica" \
  -H "Authorization: Bearer <token_aqui>"
```

### 3. Control de Inventario

**Agregar Stock:**
```bash
curl -X POST "http://localhost:8001/products/1/add_stock" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_aqui>" \
  -d "{
    \"cantidad\": 5,
    \"justification\": \"Reabastecimiento de almacén\"
  }"
```

**Realizar Venta (requiere rol: vendedor):**
```bash
curl -X POST "http://localhost:8001/products/1/sell" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_aqui>" \
  -d "{
    \"cantidad\": 2
  }"
```

**Consultar Movimientos del Producto:**
```bash
curl -X GET "http://localhost:8001/products/1/movements" \
  -H "Authorization: Bearer <token_aqui>"
```

### 4. Auditoría

**Ver Todos los Movimientos (solo auditoria):**
```bash
curl -X GET "http://localhost:8001/movements" \
  -H "Authorization: Bearer <token_auditoria>"
```

---

## 🔒 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **admin_usuarios** | Crear, leer, actualizar, eliminar usuarios |
| **encargado_deposito** | Crear/editar/eliminar productos, agregar/quitar stock |
| **vendedor** | Ver productos, realizar ventas |
| **auditoria** | Ver todos los movimientos e historial completo |

---

## 📊 Monitoreo y Métricas

**Acceder a Prometheus:**
```
http://localhost:9090  # (Si está expuesto)
```

**Métricas disponibles:**
- `fastapi_requests_total`: Total de requests
- `fastapi_requests_duration_seconds`: Duración de requests
- `fastapi_requests_exceptions_total`: Total de excepciones

---

## 🐛 Troubleshooting

### El frontend no se conecta al backend
- Verificar que el backend esté corriendo en puerto 8001
- Verificar CORS configuration en `backend/app/main.py`
- Revisar console del navegador para errores

### Error de base de datos
- Verificar permisos de escritura en `/code/data/`
- Verificar que SQLite esté instalado
- Revisar logs de Docker: `docker logs sut-backend`

### Token inválido
- Regenerar token haciendo login nuevamente
- Verificar que el token esté siendo enviado correctamente en header `Authorization: Bearer <token>`
- Verificar que no haya expirado

---

## 📝 Resumen

Este proyecto es un **sistema completo de gestión de stock** que demuestra:

✅ Arquitectura moderna (FastAPI + React)
✅ Autenticación y autorización segura
✅ Base de datos relacional con ORM
✅ API RESTful bien estructurada
✅ Control de acceso basado en roles
✅ Auditoría y trazabilidad completa
✅ Containerización con Docker
✅ Monitoreo y métricas
✅ Interfaz web responsive

Ideal para:
- Aprendizaje de desarrollo web full-stack
- Pruebas de automatización de APIs (QA)
- Demostración de mejores prácticas
- Base para extensiones y personalizaciones

---

**Versión:** 1.0
**Última actualización:** Abril 2026
**Autor:** Rafael Rodi
**Repositorio:** https://github.com/rafaelorodi/SistemaDeStock-FastAPI-Pruebas
