

import { useEffect, useState } from "react";
import { api } from "../api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = ["#168aad", "#20a486", "#f4a340", "#8174d8", "#e56b83"];

const money = (value: unknown) =>
  `S/ ${Number(value ?? 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const normalize = (data: any) =>
  Array.isArray(data) ? data : data?.data ?? [];

export function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setApiError("");

      const results = await Promise.allSettled([
        api.get("/dashboard/summary"),
        api.get("/dashboard/series"),
        api.get("/insights"),
      ]);

      if (!active) return;

      const [summary, salesSeries, insightData] = results;

      if (summary.status === "fulfilled") {
        setD(summary.value.data?.data ?? summary.value.data);
      } else {
        setApiError("No se pudo cargar el resumen del negocio.");
      }

      if (salesSeries.status === "fulfilled") {
        setSeries(normalize(salesSeries.value.data));
      }

      if (insightData.status === "fulfilled") {
        setInsights(normalize(insightData.value.data));
      }

      setLoading(false);
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const chartData = series
    .map((item) => ({
      date: String(item.date ?? ""),
      sales: Number(item.sales ?? 0),
    }))
    .filter((item) => Number.isFinite(item.sales))
    .sort((a, b) => a.date.localeCompare(b.date));

  const distribution = chartData
    .filter((item) => item.sales > 0)
    .map((item) => ({
      name: item.date || "Sin fecha",
      value: item.sales,
    }));

  const commonAxis = {
    tick: { fill: "#718096", fontSize: 12 },
    axisLine: false,
    tickLine: false,
  };

  const tooltipStyle = {
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 28px rgba(15, 23, 42, 0.10)",
  };

  return (
    <div className="dashboard-page">
      <div className="pagehead dashboard-heading">
        <div>
          <span className="eyebrow">CENTRO DE CONTROL</span>
          <h1>Dashboard ejecutivo</h1>
          <p>Indicadores comerciales y evolución del negocio.</p>
        </div>
        <div className="dashboard-live">
          <span className="dashboard-live-dot" />
          Resumen del negocio
        </div>
      </div>

      {apiError && (
        <div className="alert" role="alert">{apiError}</div>
      )}

      <div className="cards dashboard-kpis">
        <Card
          label="Ingresos registrados"
          value={money(d?.revenue)}
          note="Importe de ventas reportado por la API"
          accent="blue"
        />
        <Card
          label="Transacciones"
          value={Number(d?.sales_count ?? 0).toLocaleString("es-PE")}
          note="Operaciones registradas"
          accent="teal"
        />
        <Card
          label="Ticket promedio"
          value={money(d?.average_ticket)}
          note="Promedio por transacción"
          accent="purple"
        />
        <Card
          label="Clientes"
          value={Number(d?.customers ?? 0).toLocaleString("es-PE")}
          note="Clientes registrados"
          accent="orange"
        />
      </div>

      <div className="dashboard-section-heading">
        <div>
          <h2>Rendimiento comercial</h2>
          <p>Consulta los ingresos por fecha y las principales tendencias.</p>
        </div>
      </div>

      <div className="grid2 dashboard-primary-grid">
        <div className="panel dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h3>Evolución de ventas</h3>
              <p>Importe registrado en cada fecha disponible.</p>
            </div>
            <span className="chart-tag">TENDENCIA</span>
          </div>

          <div className="chart dashboard-chart">
            {loading ? (
              <Empty text="Cargando ventas..." />
            ) : chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 15, right: 12, left: 8, bottom: 5 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="#edf1f7"
                    strokeDasharray="4 4"
                  />
                  <XAxis dataKey="date" {...commonAxis} tickMargin={12} />
                  <YAxis
                    {...commonAxis}
                    tickFormatter={(v) => `S/ ${Number(v).toLocaleString("es-PE")}`}
                    width={85}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [money(v), "Ventas"]}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    name="Ventas"
                    stroke="#168aad"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#168aad", strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: "#fff", strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty text="Todavía no hay ventas para representar." />
            )}
          </div>
        </div>

        <div className="panel dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h3>Perspectivas del negocio</h3>
              <p>Observaciones generadas por el sistema.</p>
            </div>
            <span className="chart-tag">ANÁLISIS</span>
          </div>

          <div className="dashboard-insights">
            {insights.length ? (
              insights.map((item, index) => (
                <div className="insight dashboard-insight" key={item.id ?? index}>
                  <span className="insight-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <b>{item.title || "Perspectiva comercial"}</b>
                    <p>{item.message || "No hay descripción disponible."}</p>
                    {item.evidence && <small>{item.evidence}</small>}
                  </div>
                </div>
              ))
            ) : (
              <Empty text="No hay perspectivas disponibles actualmente." />
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-section-heading">
        <div>
          <h2>Visualización de indicadores</h2>
          <p>Distintas perspectivas de los mismos datos comerciales.</p>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="panel dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h3>Comparación por fecha</h3>
              <p>Importes de venta en cada periodo disponible.</p>
            </div>
          </div>

          <div className="chart dashboard-chart">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 8, left: 8, bottom: 5 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="#edf1f7"
                    strokeDasharray="4 4"
                  />
                  <XAxis dataKey="date" {...commonAxis} tickMargin={10} />
                  <YAxis
                    {...commonAxis}
                    tickFormatter={(v) => `S/ ${Number(v).toLocaleString("es-PE")}`}
                    width={85}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [money(v), "Ventas"]}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Bar
                    dataKey="sales"
                    name="Ventas"
                    fill="#20a486"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </div>
        </div>

        <div className="panel dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h3>Tendencia de ingresos</h3>
              <p>Área visual para identificar variaciones.</p>
            </div>
          </div>

          <div className="chart dashboard-chart">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 12, left: 8, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8174d8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8174d8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="#edf1f7"
                    strokeDasharray="4 4"
                  />
                  <XAxis dataKey="date" {...commonAxis} tickMargin={10} />
                  <YAxis
                    {...commonAxis}
                    tickFormatter={(v) => `S/ ${Number(v).toLocaleString("es-PE")}`}
                    width={85}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [money(v), "Ventas"]}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Ingresos"
                    stroke="#8174d8"
                    strokeWidth={2.5}
                    fill="url(#salesAreaGradient)"
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </div>
        </div>

        <div className="panel dashboard-panel dashboard-pie-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h3>Participación por fecha</h3>
              <p>Porcentaje del importe total representado.</p>
            </div>
          </div>

          <div className="chart dashboard-chart">
            {distribution.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    innerRadius={57}
                    outerRadius={91}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {distribution.map((item, index) => (
                      <Cell
                        key={`${item.name}-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [money(v), "Ventas"]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, note, accent }: any) {
  return (
    <div className={`card dashboard-kpi dashboard-kpi-${accent}`}>
      <div className="dashboard-kpi-top">
        <span>{label}</span>
        <span className="dashboard-kpi-dot" />
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Empty({ text = "No hay datos disponibles para esta gráfica." }: { text?: string }) {
  return (
    <div className="chart-empty dashboard-empty">
      <span className="dashboard-empty-icon">—</span>
      <strong>{text}</strong>
      <small>Los datos aparecerán cuando estén disponibles en la API.</small>
    </div>
  );
}

