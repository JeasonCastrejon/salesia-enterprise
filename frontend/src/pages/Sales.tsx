import { useEffect, useState } from "react";
import { api } from "../api";

export function Sales() {
  const [rows, setRows] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cid, setCid] = useState("");
  const [pid, setPid] = useState("");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const r = await api.get("/sales");
      // Aseguramos que se lea correctamente si viene en una propiedad .data o directo como array
      setRows(Array.isArray(r.data) ? r.data : r.data?.data || []);
    } catch (error) {
      console.error("Error al cargar ventas:", error);
    }
  };

  useEffect(() => {
    load();
    api.get("/customers").then((r) => setCustomers(Array.isArray(r.data) ? r.data : r.data?.data || []));
    api.get("/products").then((r) => setProducts(Array.isArray(r.data) ? r.data : r.data?.data || []));
  }, []);

  async function sell(e: any) {
    e.preventDefault();
    if (!cid || !pid) {
      setMsg("Por favor, selecciona un cliente y un producto.");
      return;
    }
    try {
      const r = await api.post("/sales", {
        customer_id: Number(cid),
        items: [{ product_id: Number(pid), quantity: Number(qty) }],
        tax_rate: 0.18,
        payment_method: "cash"
      });
      
      const saleData = r.data?.data || r.data;
      setMsg(`Venta #${saleData.id || "Registrada"} exitosa: S/ ${(saleData.total || 0).toFixed(2)}`);
      setCid("");
      setPid("");
      setQty(1);
      await load();
    } catch (err: any) {
      setMsg(err.response?.data?.detail || "Error al registrar la venta");
    }
  }

  // Función auxiliar para buscar el nombre del cliente por su ID en la lista local si el backend no lo anida
  const getCustomerName = (row: any) => {
    if (row.customer?.name) return row.customer.name;
    const found = customers.find((c) => c.id === row.customer_id);
    return found ? found.name : `Cliente de la venta`;
  };

  return (
    <div>
      <div className="pagehead">
        <div>
          <span className="eyebrow">OPERACIONES</span>
          <h1>Ventas</h1>
          <p>Registra una venta y actualiza el inventario.</p>
        </div>
      </div>
      
      <div className="panel formrow" style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <select value={cid} onChange={(e) => setCid(e.target.value)}>
          <option value="">Cliente</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        
        <select value={pid} onChange={(e) => setPid(e.target.value)}>
          <option value="">Producto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} — S/ {p.price}</option>
          ))}
        </select>
        
        <input 
          type="number" 
          min="1" 
          value={qty} 
          onChange={(e) => setQty(Number(e.target.value))} 
        />
        <button className="primary" onClick={sell}>Registrar venta</button>
      </div>

      {msg && <div className="notice" style={{ padding: "10px", marginBottom: "20px", background: "#f0f4f8", borderRadius: "5px" }}>{msg}</div>}

      <div className="panel tablewrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "10px" }}>No hay transacciones registradas.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{getCustomerName(r)}</td>
                  <td>S/ {(r.total || 0).toFixed(2)}</td>
                  <td><span className="badge">{r.status || "completed"}</span></td>
                  <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "Reciente"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
