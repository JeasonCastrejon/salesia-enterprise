import { useEffect, useState } from "react";
import { api } from "../api";

export function Customers() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/customers")
      .then((r) => setRows(Array.isArray(r.data) ? r.data : r.data?.data || []))
      .catch((e) => {
        console.error("Error al cargar clientes:", e);
        setError("No se pudieron cargar los clientes. Comprueba la conexión con la API.");
      });
  }, []);

  return (
    <div>
      <Head title="Clientes" text="Consulta de clientes registrados." />
      {error && <div className="notice">{error}</div>}
      <div className="panel tablewrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th>Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: "center", padding: "10px" }}>No hay clientes registrados.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.email || "-"}</td>
                  <td>{r.phone || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Head({ title, text }: any) {
  return (
    <div className="pagehead">
      <div>
        <span className="eyebrow">GESTIÓN COMERCIAL</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  );
}
