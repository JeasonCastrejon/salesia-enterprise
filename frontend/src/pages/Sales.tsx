
import { useEffect, useState } from "react";
import { api } from "../api";

function todayLocal() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function normalize(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

type PickerType = "customer" | "product" | null;

export function Sales() {
  const [rows, setRows] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [cid, setCid] = useState("");
  const [pid, setPid] = useState("");
  const [qty, setQty] = useState(1);
  const [saleDate, setSaleDate] = useState(todayLocal());

  const [modalOpen, setModalOpen] = useState(false);
  const [picker, setPicker] = useState<PickerType>(null);
  const [search, setSearch] = useState("");

  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadSales() {
    try {
      const r = await api.get("/sales");
      setRows(normalize(r.data));
    } catch (e) {
      console.error("Error al cargar ventas:", e);
      setError(true);
      setMsg("No se pudo cargar el historial de ventas.");
    }
  }

  async function loadCatalogs() {
    setLoading(true);

    try {
      const [customerResponse, productResponse] = await Promise.all([
        api.get("/customers"),
        api.get("/products"),
      ]);

      setCustomers(normalize(customerResponse.data));
      setProducts(normalize(productResponse.data));
    } catch (e) {
      console.error("Error al cargar los catálogos:", e);
      setError(true);
      setMsg("No se pudieron cargar los clientes o productos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
    loadCatalogs();
  }, []);

  const customer = customers.find(
    (c) => String(c.id) === cid
  );

  const product = products.find(
    (p) => String(p.id) === pid
  );

  const filteredCustomers = customers.filter((c) =>
    [
      c.id,
      c.name,
      c.email,
      c.phone,
      c.document_number,
    ].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    )
  );

  const filteredProducts = products.filter((p) =>
    [
      p.id,
      p.name,
      p.sku,
      p.price,
    ].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    )
  );

  function openPicker(type: "customer" | "product") {
    setSearch("");
    setPicker(type);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setPicker(null);
    setSearch("");
  }

  function getCustomerName(row: any) {
    if (row.customer?.name) return row.customer.name;

    const found = customers.find(
      (c) => Number(c.id) === Number(row.customer_id)
    );

    return found?.name || `Cliente #${row.customer_id ?? "—"}`;
  }

  async function sell(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setError(false);

    if (!cid || !pid || !saleDate) {
      setMsg("Selecciona un cliente, un producto y una fecha.");
      setError(true);
      return;
    }

    if (!Number.isInteger(qty) || qty < 1) {
      setMsg("La cantidad debe ser un número entero mayor que cero.");
      setError(true);
      return;
    }

    if (
      product?.stock != null &&
      Number(product.stock) < qty
    ) {
      setMsg(`Stock insuficiente. Disponible: ${product.stock}.`);
      setError(true);
      return;
    }

    setSaving(true);

    try {
      const response = await api.post("/sales", {
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

      const result = response.data?.data ?? response.data;
      const total = Number(result.total ?? 0);

      setMsg(
        `Venta #${result.id ?? "registrada"} creada correctamente. Total: S/ ${total.toFixed(2)}`
      );
      setError(false);

      setModalOpen(false);
      setPicker(null);
      setCid("");
      setPid("");
      setQty(1);
      setSaleDate(todayLocal());

      await Promise.all([loadSales(), loadCatalogs()]);
    } catch (e: any) {
      console.error("Error al registrar la venta:", e);
      setMsg(
        e.response?.data?.detail ??
          "No se pudo registrar la venta. Comprueba los datos y la API."
      );
      setError(true);
    } finally {
      setSaving(false);
    }
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

      <div className="panel">
        <h3>Historial de ventas</h3>

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
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td>{getCustomerName(row)}</td>
                    <td>
                      S/ {Number(row.total ?? 0).toFixed(2)}
                    </td>
                    <td>
                      <span className="badge">
                        {row.status || "completed"}
                      </span>
                    </td>
                    <td>
                      {row.sale_date
                        ? String(row.sale_date).slice(0, 10)
                        : row.created_at
                        ? new Date(row.created_at).toLocaleDateString("es-PE")
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="sale-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !picker &&
              !saving
            ) {
              closeModal();
            }
          }}
        >
          <section
            className="sale-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-title"
          >
            <header className="sale-modal-header">
              <div>
                <span className="eyebrow">NUEVA OPERACIÓN</span>
                <h2 id="sale-title">Registrar venta</h2>
                <p>Selecciona los datos de la operación.</p>
              </div>

              <button
                type="button"
                className="sale-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Cerrar"
              >
                ×
              </button>
            </header>

            <form onSubmit={sell}>
              <div className="sale-field">
                <label>Cliente</label>
                <button
                  type="button"
                  className="sale-picker-trigger"
                  onClick={() => openPicker("customer")}
                >
                  <span>
                    <strong>
                      {customer?.name || "Seleccionar cliente"}
                    </strong>
                    <small>
                      {customer
                        ? customer.email || customer.phone || `ID: ${customer.id}`
                        : "Buscar en el catálogo de clientes"}
                    </small>
                  </span>
                  <span>⌕</span>
                </button>
              </div>

              <div className="sale-field">
                <label>Producto</label>
                <button
                  type="button"
                  className="sale-picker-trigger"
                  onClick={() => openPicker("product")}
                >
                  <span>
                    <strong>
                      {product?.name || "Seleccionar producto"}
                    </strong>
                    <small>
                      {product
                        ? `S/ ${Number(product.price ?? 0).toFixed(2)} · Stock: ${product.stock ?? "—"}`
                        : "Buscar en el catálogo de productos"}
                    </small>
                  </span>
                  <span>⌕</span>
                </button>
              </div>

              <div className="sale-form-grid">
                <div className="sale-field">
                  <label htmlFor="sale-qty">Cantidad</label>
                  <input
                    id="sale-qty"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                  />
                </div>

                <div className="sale-field">
                  <label htmlFor="sale-date">Fecha de venta</label>
                  <input
                    id="sale-date"
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                  />
                </div>
              </div>

              {product && (
                <div className="sale-total">
                  <span>Subtotal estimado</span>
                  <strong>
                    S/ {(Number(product.price ?? 0) * qty).toFixed(2)}
                  </strong>
                  <small>
                    El total definitivo puede incluir el impuesto del 18%.
                  </small>
                </div>
              )}

              <div className="sale-modal-actions">
                <button
                  type="button"
                  className="sale-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary sale-save-button"
                  disabled={saving || loading}
                >
                  {saving ? "Guardando..." : "Guardar venta"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {picker && (
        <div
          className="sale-modal-overlay sale-picker-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setPicker(null);
              setSearch("");
            }
          }}
        >
          <section
            className="sale-modal sale-picker-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="picker-title"
          >
            <header className="sale-modal-header">
              <div>
                <span className="eyebrow">CATÁLOGO</span>
                <h2 id="picker-title">
                  {picker === "customer"
                    ? "Seleccionar cliente"
                    : "Seleccionar producto"}
                </h2>
                <p>
                  Busca y selecciona un registro de la tabla.
                </p>
              </div>

              <button
                type="button"
                className="sale-close"
                onClick={() => {
                  setPicker(null);
                  setSearch("");
                }}
                aria-label="Cerrar selector"
              >
                ×
              </button>
            </header>

            <input
              className="sale-search"
              type="search"
              placeholder={
                picker === "customer"
                  ? "Buscar por nombre, correo, teléfono o ID..."
                  : "Buscar por producto, SKU, precio o ID..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />

            <div className="tablewrap sale-picker-table">
              <table>
                {picker === "customer" ? (
                  <>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Teléfono</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((c) => (
                        <tr key={c.id}>
                          <td>{c.id}</td>
                          <td>{c.name}</td>
                          <td>{c.email || "—"}</td>
                          <td>{c.phone || "—"}</td>
                          <td>
                            <button
                              type="button"
                              className="primary sale-select-button"
                              onClick={() => {
                                setCid(String(c.id));
                                setPicker(null);
                                setSearch("");
                              }}
                            >
                              Seleccionar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="sale-empty-cell">
                            No se encontraron clientes.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Producto</th>
                        <th>SKU</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p.id}>
                          <td>{p.id}</td>
                          <td>{p.name}</td>
                          <td>{p.sku || "—"}</td>
                          <td>
                            S/ {Number(p.price ?? 0).toFixed(2)}
                          </td>
                          <td>{p.stock ?? "—"}</td>
                          <td>
                            <button
                              type="button"
                              className="primary sale-select-button"
                              disabled={
                                p.active === false ||
                                (p.stock != null && Number(p.stock) < 1)
                              }
                              onClick={() => {
                                setPid(String(p.id));
                                setPicker(null);
                                setSearch("");
                              }}
                            >
                              Seleccionar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="sale-empty-cell">
                            No se encontraron productos.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </>
                )}
              </table>
            </div>

            <div className="sale-modal-actions">
              <button
                type="button"
                className="sale-secondary-button"
                onClick={() => {
                  setPicker(null);
                  setSearch("");
                }}
              >
                Volver a la venta
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
