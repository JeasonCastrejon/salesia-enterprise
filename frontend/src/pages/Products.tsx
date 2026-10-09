import { useEffect, useState } from "react";
import { api } from "../api";

export function Products() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/products")
      .then((r) => setRows(Array.isArray(r.data) ? r.data : r.data?.data || []))
      .catch((e) => {
        console.error("Error al cargar productos:", e);
        setError("No se pudieron cargar los productos. Comprueba la conexión con la API.");
      });
  }, []);

  return (
    <div>
      <div className="pagehead">
        <div>
          <span className="eyebrow">CATÁLOGO</span>
          <h1>Productos</h1>
          <p>Consulta de precios, stock y estado del catálogo.</p>
        </div>
      </div>

      {error && <div className="notice">{error}</div>}

      <div className="panel tablewrap">
        <table>
          <thead>
            <tr>
              <th>PRODUCTO</th>
              <th>SKU</th>
              <th>PRECIO</th>
              <th>STOCK</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "10px" }}>No hay productos registrados.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.sku}</td>
                  <td>S/ {Number(r.price || 0).toFixed(2)}</td>
                  <td>{r.stock}</td>
                  <td><span className="badge">{r.active === false ? "Inactivo" : "Activo"}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
