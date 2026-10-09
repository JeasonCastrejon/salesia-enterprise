import random
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.models import Product, Customer, Employee

try:
    from app.models.models import Sale, SaleDetail
except ImportError:
    try:
        from app.models.models import Order as Sale, OrderDetail as SaleDetail
    except ImportError:
        print("Error: No se encontró el modelo Sale u Order en models.py.")
        exit()

def inject():
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        customers = db.query(Customer).all()
        if not products or not customers:
            print("Error: No hay productos o clientes base en la base de datos.")
            return
        
        # Corrección de la lista: obtenemos el company_id del primer producto
        company_id = products[0].company_id if products else 1
        base_date = datetime.now() - timedelta(days=30)
        
        if db.query(Sale).first():
            print("Ya existen ventas cargadas en el sistema. Saltando inyección.")
            return

        print("Inyectando historial analítico de ventas en SQLite para la Semana 07...")
        
        for i in range(1, 26):
            cust = random.choice(customers)
            prod = random.choice(products)
            qty = random.randint(1, 3)
            tot = prod.price * qty
            s_date = base_date + timedelta(days=random.randint(1, 28), hours=random.randint(8, 18))
            
            ns = Sale(
                customer_id=cust.id, 
                company_id=company_id, 
                subtotal=tot,
                discount=0.0,
                tax=0.0,
                total=tot, 
                status="completed", 
                created_at=s_date
            )
            db.add(ns)
            db.flush()
            
            s_id = ns.id if hasattr(ns, "id") else getattr(ns, "order_id", None)
            
            # Instanciamos el detalle mapeando los campos exactos de tu base de datos
            nd = SaleDetail(
                sale_id=s_id, 
                product_id=prod.id
            )
            
            # Asignación dinámica de cantidad (quantity / qty)
            if hasattr(nd, "quantity"):
                setattr(nd, "quantity", qty)
            elif hasattr(nd, "qty"):
                setattr(nd, "qty", qty)

            # Asignación dinámica de precio unitario (unit_price / price)
            if hasattr(nd, "unit_price"):
                setattr(nd, "unit_price", float(prod.price))
            elif hasattr(nd, "price"):
                setattr(nd, "price", float(prod.price))

            # Asignación de los subtotales usando las variables de tu modelo ('line_total')
            if hasattr(nd, "line_total"):
                setattr(nd, "line_total", float(tot))
            elif hasattr(nd, "subtotal"):
                setattr(nd, "subtotal", float(tot))
                
            db.add(nd)
            
        db.commit()
        print("¡Éxito! Se han inyectado 25 ventas con sus respectivos detalles en SQLite.")
    except Exception as e:
        db.rollback()
        print(f"Error durante la inyección: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    inject()
