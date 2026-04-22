from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from prometheus_fastapi_instrumentator import Instrumentator
from . import models, schemas, database, auth 

# Crea las tablas
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="QA Professional SUT API")

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ROLES PERMITIDOS
VALID_ROLES = ["admin_usuarios", "encargado_deposito", "vendedor", "auditoria"]

# --- LÓGICA DE SEGURIDAD Y ROLES ---

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except auth.JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

# --- ENDPOINTS DE USUARIOS (Roles y Auth) ---

@app.post("/register", response_model=schemas.UserResponse, tags=["Users"])
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está registrado")
    
    if user.rol not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Rol inválido. Usa uno de: {VALID_ROLES}")

    hashed_pwd = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_pwd, rol=user.rol)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/token", response_model=schemas.Token, tags=["Auth"])
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    access_token = auth.create_access_token(data={"sub": user.username, "rol": user.rol})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users", response_model=List[schemas.UserResponse], tags=["Users"])
def get_all_users(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.rol != "admin_usuarios":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo admin_usuarios.")
    return db.query(models.User).all()

@app.put("/users/{user_id}", response_model=schemas.UserResponse, tags=["Users"])
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.rol != "admin_usuarios":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo admin_usuarios.")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.username is not None:
        if db.query(models.User).filter(models.User.username == user.username, models.User.id != user_id).first():
            raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")
        db_user.username = user.username
    if user.password is not None:
        db_user.hashed_password = auth.get_password_hash(user.password)
    if user.rol is not None:
        if user.rol not in VALID_ROLES:
            raise HTTPException(status_code=400, detail=f"Rol inválido. Usa uno de: {VALID_ROLES}")
        db_user.rol = user.rol
    if user.is_active is not None:
        db_user.is_active = user.is_active

    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Users"])
def delete_user(user_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.rol != "admin_usuarios":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo admin_usuarios.")
        
    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(user_to_delete)
    db.commit()
    return {"message": "Usuario eliminado exitosamente"}

# --- ENDPOINTS DE PRODUCTOS ---

@app.get("/products", response_model=List[schemas.Product], tags=["Products"])
def get_products(category: Optional[str] = None, db: Session = Depends(database.get_db)):
    if category:
        return db.query(models.Product).filter(models.Product.category == category).all()
    return db.query(models.Product).all()

@app.post("/products", response_model=schemas.Product, status_code=201, tags=["Products"])
def create_product(product: schemas.ProductCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.rol != "encargado_deposito":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo encargado_deposito.")
        
    new_product = models.Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    new_movement = models.ProductMovement(
        product_id=new_product.id,
        user_id=current_user.id,
        movement_type="ENTRADA",
        quantity=new_product.stock,
        justification="Creación inicial"
    )
    db.add(new_movement)
    db.commit()
    
    return new_product

@app.put("/products/{product_id}", response_model=schemas.Product, tags=["Products"])
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.rol != "encargado_deposito":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo encargado_deposito.")
        
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    if not product.justification:
        raise HTTPException(status_code=400, detail="Debe justificar la modificación del producto")

    if product.name is not None:
        db_product.name = product.name
    if product.description is not None:
        db_product.description = product.description
    if product.category is not None:
        db_product.category = product.category
    if product.price is not None:
        db_product.price = product.price

    new_movement = models.ProductMovement(
        product_id=db_product.id,
        user_id=current_user.id,
        movement_type="MODIFICACION",
        justification=product.justification,
        quantity=0
    )
    db.add(new_movement)

    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Products"])
def delete_product(product_id: int, justification: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.rol != "encargado_deposito":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo encargado_deposito.")
    
    if not justification:
        raise HTTPException(status_code=400, detail="Debe justificar la eliminación del producto")
        
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    new_movement = models.ProductMovement(
        product_id=product.id,
        user_id=current_user.id,
        movement_type="ELIMINACION",
        justification=justification,
        quantity=product.stock
    )
    db.add(new_movement)
    
    db.delete(product)
    db.commit()
    return {"message": "Producto eliminado exitosamente"}

# --- CONTROL DE INVENTARIO (KARDEX) ---

@app.post("/products/{product_id}/add_stock", tags=["Inventory"])
def add_stock(product_id: int, data: schemas.StockUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.rol != "encargado_deposito":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo encargado_deposito.")
        
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    if data.cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")

    product.stock += data.cantidad
    
    new_movement = models.ProductMovement(
        product_id=product.id,
        user_id=current_user.id,
        movement_type="ENTRADA",
        quantity=data.cantidad,
        justification=data.justification or "Aumento de stock"
    )
    db.add(new_movement)
    db.commit()
    return {"message": "Stock agregado", "nuevo_stock": product.stock}

@app.post("/products/{product_id}/remove_stock", tags=["Inventory"])
def remove_stock(product_id: int, data: schemas.StockUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.rol != "encargado_deposito":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo encargado_deposito.")
        
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    if data.cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")
        
    if not data.justification:
        raise HTTPException(status_code=400, detail="Debe justificar la disminución de stock")

    if product.stock < data.cantidad:
        raise HTTPException(status_code=400, detail=f"Stock insuficiente. Solo quedan {product.stock}.")

    product.stock -= data.cantidad
    
    new_movement = models.ProductMovement(
        product_id=product.id,
        user_id=current_user.id,
        movement_type="SALIDA",
        quantity=data.cantidad,
        justification=data.justification
    )
    db.add(new_movement)
    db.commit()
    return {"message": "Stock disminuido", "nuevo_stock": product.stock}

@app.post("/products/{product_id}/sell", tags=["Inventory"])
def sell_product(product_id: int, sale: schemas.StockUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.rol != "vendedor":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo vendedor.")
        
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    if product.stock < sale.cantidad:
        raise HTTPException(status_code=400, detail=f"Stock insuficiente. Solo quedan {product.stock}.")
        
    product.stock -= sale.cantidad
    
    new_movement = models.ProductMovement(
        product_id=product.id,
        user_id=current_user.id,
        movement_type="VENTA",
        quantity=sale.cantidad,
        justification=f"Venta realizada por {current_user.username}"
    )
    db.add(new_movement)
    db.commit()
    return {"message": "Venta exitosa", "stock_restante": product.stock}

@app.get("/products/{product_id}/movements", response_model=List[schemas.MovementResponse], tags=["Inventory"])
def get_product_movements(product_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.rol not in ["auditoria", "encargado_deposito"]:
        raise HTTPException(status_code=403, detail="Acceso denegado.")
        
    movements = db.query(models.ProductMovement).filter(models.ProductMovement.product_id == product_id).all()
    
    # Enriquecemos la respuesta con nombres
    for m in movements:
        m.username = m.user.username if m.user else "Desconocido"
        m.product_name = m.product.name if m.product else "Producto Eliminado"
        
    return movements

@app.get("/movements", response_model=List[schemas.MovementResponse], tags=["Inventory"])
def get_all_movements(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.rol != "auditoria":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo auditoria.")
        
    movements = db.query(models.ProductMovement).all()
    
    for m in movements:
        m.username = m.user.username if m.user else "Desconocido"
        m.product_name = m.product.name if m.product else "Producto Eliminado"
        
    return movements

Instrumentator().instrument(app).expose(app)