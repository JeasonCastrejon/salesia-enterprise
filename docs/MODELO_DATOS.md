# Modelo de datos

Entidades principales:
- users
- roles
- companies
- customers
- categories
- products
- employees
- sales
- sale_details
- payments
- inventory
- inventory_movements
- statistical_analyses
- statistical_results
- bayes_analyses
- insights
- audit_logs

Relaciones principales:
company -> users/customers/products/employees/sales
products -> categories
sales -> sale_details -> products
sales -> payments
products -> inventory -> inventory_movements
sales -> statistical analyses / insights
