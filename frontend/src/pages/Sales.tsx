
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
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>{getCustomerName(r)}</td>
                    <td>S/ {Number(r.total ?? 0).toFixed(2)}</td>
                    <td>
                      <span className="badge">
                        {r.status || "completed"}
                      </span>
                    </td>
                    <td>
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
              {/* SELECTOR DE CLIENTE */}
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

                  <button
                    type="button"
                    className="sale-select-button"
                    onClick={() => openPicker("customer")}
                  >
                    Seleccionar cliente
                  </button>
                </div>
              </div>

              {/* SELECTOR DE PRODUCTO */}
              <div className="sale-field">
                <span>Producto</span>

                <div className="sale-selection">
                  <div className="sale-selection-info">
                    <strong>
                      {selectedProduct?.name || "Ningún producto seleccionado"}
                    </strong>
                    {selectedProduct && (
                      <small>
                        SKU: {selectedProduct.sku || "No indicado"} · Precio: S/{" "}
                        {Number(selectedProduct.price ?? 0).toFixed(2)}
                        {selectedProduct.stock != null
                          ? ` · Stock: ${selectedProduct.stock}`
                          : ""}
                      </small>
                    )}
                  </div>

                  <button
                    type="button"
                    className="sale-select-button"
                    onClick={() => openPicker("product")}
                  >
                    Seleccionar producto
                  </button>
                </div>
              </div>

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

              {selectedProduct && (
                <div className="sale-total-preview">
                  <span>Subtotal estimado</span>
                  <strong>
                    S/{" "}
                    {(
                      Number(selectedProduct.price ?? 0) * Math.max(0, qty)
                    ).toFixed(2)}
                  </strong>
                  <small>
                    El total final lo calcula el backend con los impuestos configurados.
                  </small>
                </div>
              )}

              <div className="sale-modal-actions">
                <button
                  type="button"
                  className="sale-cancel"
                  disabled={saving}
                  onClick={() => {
                    setModalOpen(false);
                    setPicker(null);
                  }}
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

      {/* VENTANA SECUNDARIA: TABLA DE SELECCIÓN */}
      {picker && (
        <div className="sale-picker-overlay">
          <div
            className="sale-picker-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="picker-title"
          >
            <div className="sale-modal-header">
              <div>
                <span className="eyebrow">SELECCIÓN</span>
                <h2 id="picker-title">
                  {picker === "customer"
                    ? "Seleccionar cliente"
                    : "Seleccionar producto"}
                </h2>
                <p>
                  Busca en la tabla y selecciona el registro que necesitas.
                </p>
              </div>

              <button
                type="button"
                className="sale-close"
                onClick={() => setPicker(null)}
                aria-label="Cerrar selector"
              >
                ×
              </button>
            </div>

            <input
              className="sale-search"
              type="search"
              placeholder={
                picker === "customer"
                  ? "Buscar por nombre, correo, teléfono o ID..."
                  : "Buscar por producto, SKU o precio..."
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
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Teléfono</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="sale-empty-cell">
                            No se encontraron clientes.
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((c) => (
                          <tr key={c.id}>
                            <td>{c.name || "Sin nombre"}</td>
                            <td>{c.email || "—"}</td>
                            <td>{c.phone || "—"}</td>
                            <td>
                              <button
                                type="button"
                                className="sale-select-button"
                                onClick={() => selectCustomer(c)}
                              >
                                Elegir
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>SKU</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="sale-empty-cell">
                            No se encontraron productos.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => {
                          const inactive = p.active === false;
                          const noStock =
                            p.stock != null && Number(p.stock) <= 0;

                          return (
                            <tr key={p.id}>
                              <td>{p.name || "Sin nombre"}</td>
                              <td>{p.sku || "—"}</td>
                              <td>
                                S/ {Number(p.price ?? 0).toFixed(2)}
                              </td>
                              <td>{p.stock ?? "—"}</td>
                              <td>
                                {inactive
                                  ? "Inactivo"
                                  : noStock
                                  ? "Sin stock"
                                  : "Activo"}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="sale-select-button"
                                  disabled={inactive || noStock}
                                  onClick={() => selectProduct(p)}
                                >
                                  Elegir
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </>
                )}
              </table>
            </div>

            <div className="sale-modal-actions">
              <button
                type="button"
                className="sale-cancel"
                onClick={() => setPicker(null)}
              >
                Volver a la venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
