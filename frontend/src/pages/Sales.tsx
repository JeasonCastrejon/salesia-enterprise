
import { useEffect, useState } from "react";
import { api } from "../api";

function todayLocal() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
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
  const [picker, setPicker] = useState<"customer" | "product" | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await api.get("/sales");
      setRows(Array.isArray(r.data) ? r.data : r.data?.data || []);
    } catch (e) {
      console.error("Error al cargar ventas:", e);
    }
  };

  useEffect(() => {
    load();

    api.get("/customers")
      .then((r) =>
        setCustomers(Array.isArray(r.data) ? r.data : r.data?.data || [])
      )
      .catch((e) => console.error("Error al cargar clientes:", e));

    api.get("/products")
      .then((r) =>
        setProducts(Array.isArray(r.data) ? r.data : r.data?.data || [])
      )
      .catch((e) => console.error("Error al cargar productos:", e));
  }, []);

  const selectedCustomer = customers.find(
    (c) => String(c.id) === cid
  );

  const selectedProduct = products.find(
    (p) => String(p.id) === pid
  );

  const filteredCustomers = customers.filter((c) =>
    [
      c.name,
      c.email,
      c.phone,
      c.id,
    ].some((v) =>
      String(v ?? "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const filteredProducts = products.filter((p) =>
    [
      p.name,
      p.sku,
      p.id,
      p.price,
    ].some((v) =>
      String(v ?? "").toLowerCase().includes(search.toLowerCase())
    )
  );

  function openPicker(type: "customer" | "product") {
    setSearch("");
    setPicker(type);
  }

  function selectCustomer(customer: any) {
    setCid(String(customer.id));
    setPicker(null);
    setSearch("");
  }

  function selectProduct(product: any) {
    setPid(String(product.id));
    setPicker(null);
    setSearch("");
  }

  async function sell(e: any) {
    e.preventDefault();
    setMsg("");
    setError(false);

    if (!cid || !pid || !saleDate || !Number.isInteger(qty) || qty < 1) {
      setMsg("Selecciona un cliente, un producto, una cantidad válida y una fecha.");
      setError(true);
      return;
    }

    if (
      selectedProduct?.stock != null &&
      Number(selectedProduct.stock) < qty
    ) {
      setMsg(`Stock insuficiente. Disponible: ${selectedProduct.stock}.`);
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
            quantity: qty,
          },
        ],
        tax_rate: 0.18,
        payment_method: "cash",
        sale_date: saleDate,
      });

      const saleData = r.data?.data || r.data;

      setMsg(
        `Venta #${saleData.id ?? "registrada"} creada correctamente. Total: S/ ${Number(saleData.total ?? 0).toFixed(2)}`
      );
      setError(false);
      setModalOpen(false);
      setPicker(null);
      setCid("");
      setPid("");
      setQty(1);
      setSaleDate(todayLocal());

      await load();
    } catch (err: any) {
      setMsg(
        err.response?.data?.detail ||
          "No se pudo registrar la venta. Comprueba los datos e inténtalo de nuevo."
      );
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  function getCustomerName(row: any) {
    if (row.customer?.name) return row.customer.name;

    const customer = customers.find(
      (c) => Number(c.id) === Number(row.customer_id)
    );

    return customer?.name || "Cliente de la venta";
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
          type="button"
          className="primary sale-open-button"
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
        <div className={error ? "alert" : "notice"} role="status">
          {msg}
        </div>
      )}

      {/* NUEVO CONTENEDOR DEL HISTORIAL (Imagen 1) */}
      <div className="panel sales-history-panel">
        <div className="sales-history-heading">
          <div>
            <h3>Historial de ventas</h3>
            <p>Consulta las operaciones registradas.</p>
          </div>
          <span className="sales-history-count">
            {rows.length} operaciones
          </span>
        </div>

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
                  <td colSpan={5} style={{ textAlign: "center", padding: 24 }}>
                    No hay transacciones registradas.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    {/* NUEVAS CELDAS CON CLASES DE ESTILO (Imagen 2) */}
                    <td className="sales-id">#{r.id}</td>
                    <td>{getCustomerName(r)}</td>
                    <td className="sales-amount">
                      S/ {Number(r.total ?? 0).toFixed(2)}
                    </td>
                    <td>
                      <span className="sales-status">
                        {r.status || "completed"}
                      </span>
                    </td>
                    <td className="sales-date">
                      {r.sale_date
                        ? String(r.sale_date).slice(0, 10)
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

      {/* VENTANA PRINCIPAL DE VENTA */}
      {modalOpen && (
        <div
          className="sale-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !picker && !saving) {
              setModalOpen(false);
            }
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
                <p>Selecciona los datos de la operación.</p>
              </div>

              <button
                type="button"
                className="sale-close"
                onClick={() => {
                  if (!saving) {
                    setModalOpen(false);
                    setPicker(null);
                  }
                }}
                disabled={saving}
                aria-label="Cerrar ventana"
              >
                ×
              </button>
            </div>

            <form onSubmit={sell}>
              <div className="sale-field">
                <span>Cliente</span>
                <div className="sale-selection">
                  <div className="sale-selection-info">
                    <strong>
                      {selectedCustomer?.name || "Ningún cliente seleccionado"}
                    </strong>
                    {selectedCustomer && (
                      <small>
                        {selectedCustomer.email || ""}
                        {selectedCustomer.phone
                          ? ` · ${selectedCustomer.phone}`
                          : ""}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

}
