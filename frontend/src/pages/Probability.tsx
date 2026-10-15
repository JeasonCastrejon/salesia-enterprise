
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Sale = {
  id: number;
  total: number;
  created_at?: string;
};

export function Probability() {
  const [a, setA] = useState(0.8);
  const [b, setB] = useState(0.3);
  const [pb, setPb] = useState(0.5);
  const [r, setR] = useState<any>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [salesError, setSalesError] = useState("");

  // Cargar las ventas reales del sistema
  useEffect(() => {
    api.get("/sales")
      .then((response) => {
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        setSales(data);
      })
      .catch((err) => {
        console.error("Error al cargar ventas:", err);
        setSalesError("No se pudieron cargar los indicadores comerciales.");
      });
  }, []);

  // Indicadores calculados a partir de las ventas recibidas
  const commercial = useMemo(() => {
    const revenue = sales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0
    );

    return {
      transactions: sales.length,
      revenue,
      average: sales.length ? revenue / sales.length : 0,
    };
  }, [sales]);

  // Agrupar ingresos por fecha para el gráfico comercial
  const salesByDate = useMemo(() => {
    const groups: Record<string, number> = {};

    sales.forEach((sale) => {
      const date = sale.created_at
        ? new Date(sale.created_at).toLocaleDateString("es-PE")
        : "Sin fecha";

      groups[date] = (groups[date] || 0) + Number(sale.total || 0);
    });

    return Object.entries(groups)
      .map(([date, revenue]) => ({ date, revenue }))
      .slice(-7);
  }, [sales]);

  // Comparación de las probabilidades introducidas y calculadas
  const probabilityData = useMemo(() => {
    if (!r || typeof r.posterior !== "number") return [];

    return [
      { name: "P(B|A)", value: a * 100 },
      { name: "P(A)", value: b * 100 },
      { name: "P(B)", value: pb * 100 },
      { name: "P(A|B)", value: r.posterior * 100 },
    ];
  }, [r, a, b, pb]);

  const posterior = r?.posterior;
  const validResult =
    typeof posterior === "number" &&
    Number.isFinite(posterior) &&
    posterior >= 0 &&
    posterior <= 1;

  const posteriorData = validResult
    ? [
        { name: "Probabilidad posterior", value: posterior * 100 },
        { name: "Probabilidad restante", value: (1 - posterior) * 100 },
      ]
    : [];

  async function calc() {
    setError("");
    setR(null);

    if (
      ![a, b, pb].every(Number.isFinite) ||
      a < 0 || a > 1 ||
      b < 0 || b > 1 ||
      pb <= 0 || pb > 1
    ) {
      setError("Introduce probabilidades válidas entre 0 y 1. P(B) debe ser mayor que cero.");
      return;
    }

    // P(B) debe ser compatible con la probabilidad conjunta P(B|A)P(A).
    if (pb < a * b) {
      setError(
        "Los datos no son compatibles: P(B) no puede ser menor que P(B|A) × P(A)."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/probability/bayes", {
        p_b_given_a: a,
        p_a: b,
        p_b: pb,
      });

      const result = response.data?.data ?? response.data;

      if (
        typeof result?.posterior !== "number" ||
        !Number.isFinite(result.posterior) ||
        result.posterior < 0 ||
        result.posterior > 1
      ) {
        throw new Error("La API no devolvió un resultado posterior válido.");
      }

      setR(result);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        "No se pudo calcular Bayes. Comprueba la conexión con la API."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="pagehead">
        <div>
          <span className="eyebrow">PROBABILIDAD Y ANALÍTICA</span>
          <h1>Teorema de Bayes</h1>
          <p>
            Analiza probabilidades y consulta indicadores del negocio.
          </p>
        </div>
      </div>

      {/* Indicadores comerciales */}
      <div className="cards">
        <Card
          label="Ventas registradas"
          value={commercial.transactions}
          note="Transacciones consultadas"
        />
        <Card
          label="Ingresos acumulados"
          value={`S/ ${commercial.revenue.toFixed(2)}`}
          note="Total de las ventas recibidas"
        />
        <Card
          label="Ticket promedio"
          value={`S/ ${commercial.average.toFixed(2)}`}
          note="Ingresos / transacciones"
        />
        <Card
          label="Probabilidad posterior"
          value={validResult ? `${(posterior * 100).toFixed(2)}%` : "—"}
          note="Resultado de Bayes"
        />
      </div>

      {salesError && <div className="notice">{salesError}</div>}

      {/* Formulario de Bayes */}
      <div className="panel probability">
        <h3>Parámetros del análisis</h3>
        <p>
          Introduce las probabilidades del evento y de la evidencia.
          Todos los valores se expresan entre 0 y 1.
        </p>

        <label>
          P(B|A) — Probabilidad de B si ocurre A
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={a}
            onChange={(e) => setA(Number(e.target.value))}
          />
        </label>

        <label>
          P(A) — Probabilidad inicial de A
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
          />
        </label>

        <label>
          P(B) — Probabilidad total de la evidencia
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="1"
            value={pb}
            onChange={(e) => setPb(Number(e.target.value))}
          />
        </label>

        <button
          className="primary"
          onClick={calc}
          disabled={loading}
        >
          {loading ? "Calculando..." : "Calcular Bayes"}
        </button>

        {error && <div className="alert" style={{ marginTop: 16 }}>{error}</div>}

        {validResult && (
          <div className="result">
            <span className="eyebrow">RESULTADO DEL ANÁLISIS</span>
            <h2>{(posterior * 100).toFixed(2)}%</h2>
            <p>
              Probabilidad posterior P(A|B): probabilidad de que ocurra A
              después de conocer la evidencia B.
            </p>

            <div className="notice">
              <strong>Interpretación:</strong> con las probabilidades
              introducidas, el resultado posterior es{" "}
              {(posterior * 100).toFixed(2)}%.
              El resultado depende de la calidad de los datos iniciales.
            </div>
          </div>
        )}
      </div>

      {/* Gráficos del análisis */}
      {validResult && (
        <div className="grid2">
          <div className="panel">
            <h3>Comparación de probabilidades</h3>
            <p>
              Valores introducidos y probabilidad posterior calculada.
            </p>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={probabilityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)}%`} />
                  <Bar dataKey="value" name="Probabilidad" fill="#159bb9" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <h3>Resultado posterior</h3>
            <p>Probabilidad del evento A y su complemento.</p>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={posteriorData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={({ value }) => `${Number(value).toFixed(1)}%`}
                  >
                    <Cell fill="#159bb9" />
                    <Cell fill="#dce5ef" />
                  </Pie>
                  <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico con datos reales de ventas */}
      <div className="panel">
        <h3>Ingresos por fecha</h3>
        <p>
          Evolución de las ventas registradas en el sistema.
          Este gráfico utiliza los datos devueltos por la API.
        </p>

        {salesByDate.length === 0 ? (
          <div className="notice">
            No hay ventas disponibles para mostrar. Registra ventas y verifica
            que el endpoint /sales incluya el total y la fecha.
          </div>
        ) : (
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) =>
                    `S/ ${Number(value).toFixed(2)}`
                  }
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Ingresos (S/)"
                  fill="#2563eb"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, note }: any) {
  return (
    <div className="card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
