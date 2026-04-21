from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# --- Esquemas de Autenticación y Usuario ---
class UserCreate(BaseModel):
    username: str
    password: str
    rol: str = "vendedor"

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    username: str
    rol: str
    is_active: bool
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Esquemas de Producto ---
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    price: float
    stock: int
    
class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    justification: str

class Product(ProductBase):
    id: int
    class Config:
        from_attributes = True

# --- Esquemas de Inventario / Kardex ---
class StockUpdate(BaseModel):
    cantidad: int
    justification: Optional[str] = None

class DeleteProductRequest(BaseModel):
    justification: str

class MovementResponse(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: Optional[str] = None # Nuevo: para auditoría fácil
    user_id: int
    username: Optional[str] = None # Nuevo: para saber quién lo hizo (vendedor/encargado)
    movement_type: str
    quantity: Optional[int] = None
    justification: Optional[str] = None
    date: datetime
    class Config:
        from_attributes = True