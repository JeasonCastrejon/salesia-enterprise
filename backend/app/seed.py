from app.database import SessionLocal
from app.models.models import Company, Role, User, Category, Product, Customer, Employee, Inventory
from app.security import hash_password

def seed():
    db = SessionLocal()
    try:
        if db.query(Company).first():
            return
        company = Company(name="SalesIA Demo")
        admin_role = Role(name="admin")
        manager_role = Role(name="manager")
        seller_role = Role(name="seller")
        analyst_role = Role(name="analyst")
        db.add_all([company, admin_role, manager_role, seller_role, analyst_role])
        db.flush()
        db.add(User(email="admin@salesia.com", password_hash=hash_password("admin123"),
                    full_name="Administrador SalesIA", role_id=admin_role.id, company_id=company.id))
        db.add(User(email="analista@salesia.com", password_hash=hash_password("analista123"),
                    full_name="Analista SalesIA", role_id=analyst_role.id, company_id=company.id))
        cat1, cat2 = Category(name="Tecnología"), Category(name="Oficina")
        db.add_all([cat1, cat2])
        db.flush()
        products = [
            Product(name="Laptop Pro", sku="TEC-001", price=3200, stock=25, category_id=cat1.id, company_id=company.id),
            Product(name="Monitor 24", sku="TEC-002", price=650, stock=40, category_id=cat1.id, company_id=company.id),
            Product(name="Teclado Mecánico", sku="TEC-003", price=220, stock=60, category_id=cat1.id, company_id=company.id),
            Product(name="Silla Ejecutiva", sku="OFF-001", price=780, stock=18, category_id=cat2.id, company_id=company.id),
            Product(name="Escritorio", sku="OFF-002", price=950, stock=15, category_id=cat2.id, company_id=company.id),
        ]
        db.add_all(products)
        customers = [
            Customer(name="Comercial Andina", email="contacto@andina.com", phone="999111222", company_id=company.id),
            Customer(name="Grupo Lima", email="ventas@grupolima.com", phone="999333444", company_id=company.id),
            Customer(name="Innovatec SAC", email="compras@innovatec.com", phone="999555666", company_id=company.id),
        ]
        db.add_all(customers)
        emp = Employee(name="Carlos Vendedor", role="Vendedor", company_id=company.id)
        db.add(emp)
        db.flush()
        for p in products:
            db.add(Inventory(product_id=p.id, quantity=p.stock))
        db.commit()
    finally:
        db.close()
