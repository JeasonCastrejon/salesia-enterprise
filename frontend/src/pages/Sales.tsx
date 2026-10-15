
import { useEffect, useState } from "react";
import { api } from "../api";

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}

export function Sales() {
  const [rows, setRows] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [cid, setCid] = useState("");
  const [pid, setPid] = useState("");
  const [qty, setQty] = useState(1);
  const [saleDate, setSaleDate] = useState(todayLocal());

  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await api.get("/sales");
      setRows(
        Array.isArray(r.data) ? r.data : r.data?.data || []
      );
    } catch (err) {
      console.error("Error al cargar ventas:", err);
    }
  };

  useEffect(() => {
    load();

    api.get("/customers")
      .then((r) =>
        setCustomers(
          Array.isArray(r.data) ? r.data : r.data?.data || []
        )
      )
      .catch((err) => console.error("Error al cargar clientes:", err));

    api.get("/products")
      .then((r) =>
        setProducts(
          Array.isArray(r.data) ? r.data : r.data?.data || []
        )
      )
      .catch((err) => console.error("Error al cargar productos:", err));
  }, []);

  async function sell(e: any) {
    e.preventDefault();
    setMsg("");
    setError(false);

    if (!cid || !pid || !saleDate || qty < 1) {
      setMsg("Completa todos los campos correctamente.");
      setError(true);
      return;
    }

    setSaving(true);

    try {
      const r = await api.post("/sales", {
        customer_id: Number(cid),
        items: [
          {
            product_id: Number(pid),
            quantity: Number(qty),
          },
        ],
        tax_rate: 0.18,
        payment_method: "cash",
        sale_date: saleDate,
      });

      const saleData = r.data?.data || r.data;
      const total = Number(saleData.total ?? 0);

      setMsg(
        `Venta #${saleData.id ?? "registrada"} creada correctamente. Total: S/ ${total.toFixed(2)}`
      );

      setError(false);
      setModalOpen(false);
      setCid("");
      setPid("");
      setQty(1);
      setSaleDate(todayLocal());

      await load();
    } catch (err: any) {
      setMsg(
        err.response?.data?.detail ||
          "No se pudo registrar la venta. Verifica los datos e inténtalo nuevamente."
      );
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  function getCustomerName(row: any) {
    if (row.customer?.name) return row.customer.name;

    const found = customers.find(
      (c) => Number(c.id) === Number(row.customer_id)
    );

    return found?.name || "Cliente de la venta";
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setMsg("");
    setError(false);
  }

  return (
    <div>
      <div className="pagehead">
        <div>
          <span className="eyebrow">OPERACIONES</span>
          <h1>Ventas</h1>
          <p>Registra operaciones y consulta el historial comercial.</p>
        </div>

        <button
          className="primary"
          type="button"
          onClick={() => {
            setMsg("");
            setError(false);
            setSaleDate(todayLocal());
            setModalOpen(true);
          }}
        >
          + Registrar venta
        </button>
      </div>

      {msg && (
        <div
          className={error ? "alert" : "notice"}
          style={{ marginBottom: 20 }}
          role="status"
        >
          {msg}
        </div>
      )}

      <div className="panel">
        <h3>Historial de ventas</h3>
        <p style={{ color: "#758197", marginTop: -5 }}>
          Consulta las operaciones registradas en el sistema.
        </p>

        <div className="tablewrap">
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
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: "center", padding: 24 }}
                  >
                    No hay transacciones registradas.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>{getCustomerName(r)}</td>
                    <td>
                      S/ {Number(r.total ?? 0).toFixed(2)}
                    </td>
                    <td>
                      <span className="badge">
                        {r.status || "completed"}
                      </span>
                    </td>
                    <td>
                      {r.sale_date
                        ? new Date(
                            `${r.sale_date}`.slice(0, 10) + "T12:00:00"
                          ).toLocaleDateString()
                        : r.created_at
                        ? new Date(r.created_at).toLocaleDateString()
                        : "Reciente"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VENTANA PARA REGISTRAR VENTAS */}
      {modalOpen && (
        <div
          className="sale-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="sale-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-modal-title"
          >
            <div className="sale-modal-header">
              <div>
                <span className="eyebrow">NUEVA OPERACIÓN</span>
                <h2 id="sale-modal-title">Registrar venta</h2>
                <p>Completa los datos para registrar la operación.</p>
              </div>

              <button
                type="button"
                className="sale-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Cerrar ventana"
              >
                ×
              </button>
            </div>

            <form onSubmit={sell}>
              <label className="sale-field">
                Cliente
                <select
                  value={cid}
                  onChange={(e) => setCid(e.target.value)}
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="sale-field">
                Producto
                <select
                  value={pid}
                  onChange={(e) => setPid(e.target.value)}
                  required
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — S/ {Number(p.price ?? 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="sale-fields-row">
                <label className="sale-field">
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    required
                  />
                </label>

                <label className="sale-field">
                  Fecha de venta
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    required
                  />
                </label>
              </div>

              {pid && (
                <div className="sale-total-preview">
                  <span>Total estimado antes de impuestos</span>
                  <strong>
                    S/{" "}
                    {(
                      Number(products.find(
                        (p) => Number(p.id) === Number(pid)
                      )?.price ?? 0) * Math.max(0, qty)
                    ).toFixed(2)}
                  </strong>
                  <small>
                    El importe final puede incluir el impuesto configurado.
                  </small>
                </div>
              )}

              <div className="sale-modal-actions">
                <button
                  type="button"
                  className="sale-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary"
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar venta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
