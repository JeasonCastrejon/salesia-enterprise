from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CustomerCreate(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr | None = None
    phone: str = ""

class ProductCreate(BaseModel):
    name: str = Field(min_length=2)
    sku: str
    price: float = Field(gt=0)
    stock: int = Field(ge=0)
    category_id: int

class SaleItem(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)

class SaleCreate(BaseModel):
    customer_id: int
    items: list[SaleItem]
    discount: float = Field(default=0, ge=0)
    tax_rate: float = Field(default=0.18, ge=0)
    payment_method: str = "cash"

class NumbersRequest(BaseModel):
    values: list[float] = Field(min_length=1)

class BayesRequest(BaseModel):
    p_b_given_a: float = Field(ge=0, le=1)
    p_a: float = Field(ge=0, le=1)
    p_b: float = Field(gt=0, le=1)

class RandomVariableRequest(BaseModel):
    name: str
    values: list[float] = Field(min_length=1)
