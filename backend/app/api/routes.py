import json
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import *
from app.schemas.schemas import *
from app.security import verify_password, create_token, get_current_user
from app.statistics.service import mean, median, describe
from app.probability.bayes import bayes

router = APIRouter()

@router.post("/auth/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    return {"access_token": create_token(user), "token_type": "bearer",
            "user": {"id": user.id, "name": user.full_name, "role": user.role.name}}

@router.get("/auth/me")
def me(user=Depends(get_current_user)):
    return {"id": user.id, "name": user.full_name, "email": user.email, "role": user.role.name}

@router.get("/customers")
def customers(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Customer).filter(Customer.company_id == user.company_id).order_by(Customer.id.desc()).all()

@router.post("/customers")
def create_customer(data: CustomerCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = Customer(name=data.name, email=data.email or "", phone=data.phone, company_id=user.company_id)
    db.add(c); db.commit(); db.refresh(c)
    db.add(AuditLog(user_id=user.id, action="CREATE", entity="customer", entity_id=c.id)); db.commit()
    return c

@router.get("/products")
def products(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Product).filter(Product.company_id == user.company_id).order_by(Product.id.desc()).all()

@router.post("/products")
def create_product(data: ProductCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if db.query(Product).filter(Product.sku == data.sku).first():
        raise HTTPException(409, "SKU ya existe")
    p = Product(**data.model_dump(), company_id=user.company_id)
    db.add(p); db.flush()
    db.add(Inventory(product_id=p.id, quantity=p.stock))
    db.add(AuditLog(user_id=user.id, action="CREATE", entity="product", entity_id=p.id))
    db.commit(); db.refresh(p)
    return p

@router.get("/sales")
def sales(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Sale).filter(Sale.company_id == user.company_id).order_by(Sale.id.desc()).limit(100).all()

@router.post("/sales")
def create_sale(data: SaleCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    customer = db.get(Customer, data.customer_id)
    if not customer or customer.company_id != user.company_id:
        raise HTTPException(404, "Cliente no encontrado")
    subtotal = 0
    prepared = []
    for item in data.items:
        p = db.get(Product, item.product_id)
        if not p or p.company_id != user.company_id:
            raise HTTPException(404, f"Producto {item.product_id} no encontrado")
        if p.stock < item.quantity:
            raise HTTPException(400, f"Stock insuficiente para {p.name}")
        line = p.price * item.quantity
        subtotal += line
        prepared.append((p, item.quantity, line))
    total_before_tax = subtotal - data.discount
    tax = total_before_tax * data.tax_rate
    total = total_before_tax + tax
    sale = Sale(customer_id=customer.id, company_id=user.company_id,
                subtotal=subtotal, discount=data.discount, tax=tax, total=total)
    db.add(sale); db.flush()
    for p, qty, line in prepared:
        db.add(SaleDetail(sale_id=sale.id, product_id=p.id, quantity=qty, unit_price=p.price, line_total=line))
        p.stock -= qty
        inv = db.query(Inventory).filter(Inventory.product_id == p.id).first()
        if inv: inv.quantity -= qty
        db.add(InventoryMovement(product_id=p.id, movement_type="OUT", quantity=qty, reason=f"Venta #{sale.id}"))
    db.add(Payment(sale_id=sale.id, method=data.payment_method, amount=total))
    db.add(AuditLog(user_id=user.id, action="CREATE", entity="sale", entity_id=sale.id))
    db.commit(); db.refresh(sale)
    return {"id": sale.id, "subtotal": subtotal, "tax": tax, "total": total}

@router.get("/dashboard/summary")
def dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    sales = db.query(Sale).filter(Sale.company_id == user.company_id).all()
    values = [s.total for s in sales]
    return {
        "sales_count": len(sales),
        "revenue": round(sum(values), 2),
        "average_ticket": round(mean(values), 2) if values else 0,
        "median_ticket": round(median(values), 2) if values else 0,
        "customers": db.query(Customer).filter(Customer.company_id == user.company_id).count(),
        "products": db.query(Product).filter(Product.company_id == user.company_id).count()
    }

@router.get("/dashboard/series")
def series(db: Session = Depends(get_db), user=Depends(get_current_user)):
    sales = db.query(Sale).filter(Sale.company_id == user.company_id).order_by(Sale.created_at).all()
    groups = defaultdict(float)
    for s in sales:
        groups[s.created_at.strftime("%Y-%m-%d")] += s.total
    return [{"date": k, "sales": round(v,2)} for k,v in groups.items()]

@router.post("/statistics/mean")
def statistics_mean(data: NumbersRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    result = mean(data.values)
    db.add(StatisticalAnalysis(analysis_type="mean", input_data=json.dumps(data.values), result=json.dumps({"mean":result})))
    db.commit()
    return {"operation":"mean","value":result}

@router.post("/statistics/median")
def statistics_median(data: NumbersRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    result = median(data.values)
    db.add(StatisticalAnalysis(analysis_type="median", input_data=json.dumps(data.values), result=json.dumps({"median":result})))
    db.commit()
    return {"operation":"median","value":result}

@router.post("/statistics/compare")
def statistics_compare(data: NumbersRequest, user=Depends(get_current_user)):
    m, md = mean(data.values), median(data.values)
    return {"mean":m, "median":md, "difference":m-md, "interpretation":"media mayor que mediana" if m>md else "mediana mayor o igual que media"}

@router.post("/random-variables/analyze")
def random_variable(data: RandomVariableRequest, user=Depends(get_current_user)):
    result = describe(data.values)
    result["variable"] = data.name
    return result

@router.post("/probability/bayes")
def bayes_route(data: BayesRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    result = bayes(data.p_b_given_a, data.p_a, data.p_b)
    db.add(StatisticalAnalysis(analysis_type="bayes",
        input_data=data.model_dump_json(), result=json.dumps({"posterior":result})))
    db.commit()
    return {"posterior": result, "formula":"P(A|B) = P(B|A) × P(A) / P(B)"}

@router.get("/insights")
def insights(db: Session = Depends(get_db), user=Depends(get_current_user)):
    summary = dashboard(db, user)
    out = []
    if summary["sales_count"] == 0:
        out.append({"title":"Sin ventas","message":"Todavía no existen ventas para generar patrones.","evidence":"sales_count=0"})
    else:
        if summary["average_ticket"] > summary["median_ticket"]:
            out.append({"title":"Ticket con concentración baja","message":"La media supera a la mediana, señal compatible con algunas ventas de mayor importe.","evidence":f"media={summary['average_ticket']}, mediana={summary['median_ticket']}"})
        else:
            out.append({"title":"Distribución estable","message":"La media no supera a la mediana en el conjunto actual.","evidence":f"media={summary['average_ticket']}, mediana={summary['median_ticket']}"})
    return out

@router.get("/reports")
def reports(db: Session = Depends(get_db), user=Depends(get_current_user)):
    sales = db.query(Sale).filter(Sale.company_id == user.company_id).order_by(Sale.id.desc()).all()
    return [{"id":s.id, "customer":s.customer.name, "total":s.total, "date":s.created_at.isoformat(), "status":s.status} for s in sales]

@router.get("/audit")
def audit(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(AuditLog).order_by(AuditLog.id.desc()).limit(100).all()
