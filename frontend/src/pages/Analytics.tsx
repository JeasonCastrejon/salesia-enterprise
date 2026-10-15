
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

const money = (v: number) =>
  `S/ ${v.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function Analytics() {
  const [d, setD] = useState<any>(null);
  const [values, setValues] = useState("100,200,150,300,120");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/dashboard/summary")
      .then((r) => setD(r.data?.data ?? r.data))
      .catch((e) => console.error("Error al cargar el resumen:", e));
  }, []);

  const numbers = useMemo(
    () =>
      values
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v !== "")
        .map(Number)
        .filter(Number.isFinite),
    [values]
  );

  const chartData = numbers.map((value, index) => ({
    name: `Dato ${index + 1}`,
    value,
  }));

  const localMean =
    numbers.length > 0
      ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length
      : 0;

  const sorted = [...numbers].sort((a, b) => a - b);

  const localMedian =
    sorted.length === 0
      ? 0
      : sorted.length % 2
      ? sorted[Math.floor(sorted.length / 2)]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

  const variance =
    numbers.length > 0
      ? numbers.reduce((sum, value) => sum + (value - localMean) ** 2, 0) /
        numbers.length
      : 0;

  const standardDeviation = Math.sqrt(variance);

  async function calc() {
    setError("");
    setResult(null);

    if (!numbers.length) {
      setError("Introduce al menos un número válido separado por comas.");
      return;
    }

    if (numbers.some((n) => !Number.isFinite(n))) {
      setError("Revisa los valores introducidos.");
      return;
    }

    setLoading(true);

    try {
      const r = await api.post("/statistics/compare", {
        values: numbers,
      });
      setResult(r.data?.data ?? r.data);
    } catch (e: any) {
      setError(
        e.response?.data?.detail ||
          "No se pudo completar el cálculo en el servidor."
      );
    } finally {
      setLoading(false);
    }
  }

  const mean = Number(result?.mean ?? localMean);
  const median = Number(result?.median ?? localMedian);
  const difference = Number(result?.difference ?? mean - median);

  const tooltipStyle = {
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 28px rgba(15, 23, 42, 0.10)",
  };

  return (
    <div className="analytics-page">
      <div className="pagehead">
        <div>
          <span className="eyebrow">INTELIGENCIA DE NEGOCIO</span>
          <h1>Analytics</h1>
          <p>Estadística descriptiva y análisis de los valores comerciales.</p>
        </div>
      </div>

      <div className="cards analytics-kpis">
        <Card
          label="Ticket promedio"
          value={money(Number(d?.average_ticket ?? 0))}
          note="Dato del resumen comercial"
        />
        <Card
          label="Mediana del ticket"
          value={money(Number(d?.median_ticket ?? 0))}
          note="Según los datos que expone la API"
        />
        <Card
          label="Diferencia media-mediana"
          value={money(
            Number(d?.average_ticket ?? 0) - Number(d?.median_ticket ?? 0)
          )}
          note="Promedio menos mediana"
        />
      </div>

      <div className="analytics-layout">
        <div className="panel analytics-form-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h3>Comparación estadística</h3>
              <p>Introduce importes o cualquier conjunto numérico.</p>
            </div>
            <span className="chart-tag">CÁLCULO</span>
          </div>

          <label className="analytics-label" htmlFor="analytics-values">
            Valores separados por comas
          </label>
          <textarea
            id="analytics-values"
            className="analytics-input"
            value={values}
            onChange={(e) => setValues(e.target.value)}
            placeholder="Ejemplo: 100, 200, 150, 300, 120"
            rows={3}
          />

          <div className="analytics-input-hint">
            {numbers.length} valores numéricos detectados.
          </div>

          {error && <div className="alert analytics-alert">{error}</div>}

          <button
            className="primary analytics-calculate"
            type="button"
            onClick={calc}
            disabled={loading || numbers.length === 0}
          >
            {loading ? "Calculando..." : "Calcular estadísticas"}
          </button>

          <div className="analytics-result-grid">
            <Metric label="Media" value={money(mean)} />
            <Metric label="Mediana" value={money(median)} />
            <Metric label="Diferencia" value={money(difference)} />
          </div>

          {result && (
            <div className="notice analytics-success">
              Cálculo completado con los resultados del servidor.
            </div>
          )}
        </div>

        <div className="panel analytics-chart-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h3>Distribución de valores</h3>
              <p>Comparación individual de los datos introducidos.</p>
            </div>
          </div>

          <div className="chart analytics-chart">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 12, left: 8, bottom: 5 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="#edf1f7"
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#718096", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#718096", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [money(Number(v)), "Valor"]}
                  />
                  <Legend />
                  <ReferenceLine
                    y={mean}
                    stroke="#168aad"
                    strokeDasharray="5 5"
                    label={{ value: "Media", fill: "#168aad", fontSize: 11 }}
                  />
                  <Bar
                    dataKey="value"
                    name="Valor"
                    fill="#20a486"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">Introduce valores para visualizar el gráfico.</div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-section-heading analytics-section-heading">
        <div>
          <h2>Indicadores estadísticos</h2>
          <p>Medidas calculadas a partir de los valores introducidos.</p>
        </div>
      </div>

      <div className="dashboard-charts analytics-charts">
        <div className="panel dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h3>Media frente a mediana</h3>
              <p>Comparación de las dos medidas centrales.</p>
            </div>
          </div>

          <div className="chart analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Media", valor: mean },
                  { name: "Mediana", valor: median },
                ]}
                margin={{ top: 20, right: 20, left: 12, bottom: 5 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#edf1f7"
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#718096", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#718096", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [money(Number(v)), "Importe"]}
                />
                <Bar
                  dataKey="valor"
                  name="Importe"
                  fill="#168aad"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={70}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h3>Variación de los datos</h3>
              <p>Distancia de cada valor respecto a la media.</p>
            </div>
          </div>

          <div className="chart analytics-chart">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData.map((item) => ({
                    ...item,
                    desviacion: item.value - mean,
                  }))}
                  margin={{ top: 20, right: 15, left: 8, bottom: 5 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="#edf1f7"
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#718096", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#718096", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [money(Number(v)), "Diferencia"]}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Line
                    type="monotone"
                    dataKey="desviacion"
                    name="Desviación respecto a la media"
                    stroke="#8174d8"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">No hay valores para representar.</div>
            )}
          </div>
        </div>
      </div>

      <div className="panel analytics-interpretation">
        <div className="dashboard-panel-heading">
          <div>
            <h3>Lectura estadística</h3>
            <p>Interpretación orientativa de las medidas calculadas.</p>
          </div>
        </div>

        <div className="analytics-interpretation-grid">
          <div>
            <span>Media</span>
            <p>Representa el promedio de los valores analizados.</p>
          </div>
          <div>
            <span>Mediana</span>
            <p>Representa el valor central al ordenar los datos.</p>
          </div>
          <div>
            <span>Desviación estándar</span>
            <p>Mide la dispersión respecto a la media.</p>
          </div>
        </div>

        <div className="analytics-deviation">
          <span>Desviación estándar de la muestra introducida</span>
          <strong>{money(standardDeviation)}</strong>
          <small>
            Cálculo descriptivo con división entre el número total de valores.
          </small>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, note }: any) {
  return (
    <div className="card dashboard-kpi">
      <div className="dashboard-kpi-top">
        <span>{label}</span>
        <span className="dashboard-kpi-dot" />
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="analytics-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
