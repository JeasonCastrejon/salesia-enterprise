
import { useEffect, useState } from "react";
import { api } from "../api";
import {
  LineChart,Line,BarChart,Bar,AreaChart,Area,PieChart,Pie,Cell,ResponsiveContainer,XAxis,YAxis,Tooltip,CartesianGrid,Legend,
} from "recharts";

const COLORS = ["#2583d8", "#12b8a6", "#f59e0b", "#8b78e6", "#ef647c"];

export function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    api.get("/dashboard/summary")
      .then((r) => setD(r.data))
      .catch((e) => console.error("Error en resumen:", e));

    api.get("/dashboard/series")
      .then((r) => setSeries(Array.isArray(r.data) ? r.data : []))
      .catch((e) => console.error("Error en series:", e));

    api.get("/insights")
      .then((r) => setInsights(Array.isArray(r.data) ? r.data : []))
      .catch((e) => console.error("Error en perspectivas:", e));
  }, []);

  // Normalizar los datos que ya proporciona el backend.
  const chartData = series.map((item) => ({
    date: String(item.date ?? ""),
    sales: Number(item.sales ?? 0),
  }));

  // Agrupar las ventas por fecha para la gráfica circular.
  const distribution = chartData.map((item) => ({
    name: item.date || "Sin fecha",
    value: Math.max(0, item.sales),
  })).filter((item) => item.value > 0);

  return (
    <div>
      <div className="pagehead">
        <div>
          <span className="eyebrow">RESUMEN EJECUTIVO</span>
          <h1>Dashboard</h1>
          <p>Visión general del negocio y sus indicadores.</p>
        </div>
      </div>

      {/* TARJETAS ORIGINALES: SE CONSERVAN */}
      <div className="cards">
        <Card
          label="Ingresos"
          value={`S/ ${Number(d?.revenue ?? 0).toFixed(2)}`}
          note="Ventas registradas"
        />
        <Card
          label="Transacciones"
          value={d?.sales_count ?? 0}
          note="Operaciones"
        />
        <Card
          label="Ticket promedio"
          value={`S/ ${Number(d?.average_ticket ?? 0).toFixed(2)}`}
          note="Media"
        />
        <Card
          label="Clientes"
          value={d?.customers ?? 0}
          note="Registrados"
        />
      </div>

      {/* GRÁFICA ORIGINAL + PERSPECTIVAS ORIGINALES */}
      <div className="grid2">
        <div className="panel">
          <h3>Evolución de ventas</h3>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `S/ ${Number(value).toFixed(2)}`,
                    "Ventas",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Ventas"
                  stroke="#2583d8"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3>Perspectivas</h3>
          {insights.map((x, i) => (
            <div className="insight" key={i}>
              <b>{x.title}</b>
              <p>{x.message}</p>
              <small>{x.evidence}</small>
            </div>
          ))}
          {insights.length === 0 && (
            <p>No hay perspectivas disponibles.</p>
          )}
        </div>
      </div>

      {/* NUEVAS GRÁFICAS */}
      <div className="dashboard-charts">
        {/* GRÁFICA 2: BARRAS */}
        <div className="panel">
          <h3>Comparación de ventas por fecha</h3>
          <p className="chart-description">
            Comparación de los importes registrados en cada fecha.
          </p>
          <div className="chart">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `S/ ${Number(value).toFixed(2)}`,
                      "Ventas",
                    ]}
                  />
                  <Bar
                    dataKey="sales"
                    name="Ventas"
                    fill="#12b8a6"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </div>
        </div>

        {/* GRÁFICA 3: ÁREA */}
        <div className="panel">
          <h3>Tendencia de ingresos</h3>
          <p className="chart-description">
            Vista de área para identificar subidas y bajadas.
          </p>
          <div className="chart">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `S/ ${Number(value).toFixed(2)}`,
                      "Ventas",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Ventas"
                    stroke="#8b78e6"
                    fill="#c4b5fd"
                    fillOpacity={0.45}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </div>
        </div>

        {/* GRÁFICA 4: CIRCULAR */}
        <div className="panel">
          <h3>Distribución de ventas por fecha</h3>
          <p className="chart-description">
            Participación de cada fecha en el importe representado.
          </p>
          <div className="chart">
            {distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name}: ${(Number(percent) * 100).toFixed(1)}%`
                    }
                  >
                    {distribution.map((item, index) => (
                      <Cell
                        key={`${item.name}-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `S/ ${Number(value).toFixed(2)}`,
                      "Ventas",
                    ]}
                  />
                  <Legend />
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

function Card({ label, value, note }: any) {
  return (
    <div className="card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Empty() {
  return (
    <div className="chart-empty">
      No hay datos disponibles para esta gráfica.
    </div>
  );
}
