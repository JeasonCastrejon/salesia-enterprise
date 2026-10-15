
import { useState } from "react";
import { api } from "../api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

export function Probability() {
  const [pBGivenA, setPBGivenA] = useState(0.8);
  const [pA, setPA] = useState(0.3);
  const [pB, setPB] = useState(0.5);

  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function calculate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (
      ![pBGivenA, pA, pB].every(Number.isFinite) ||
      pBGivenA < 0 ||
      pBGivenA > 1 ||
      pA < 0 ||
      pA > 1 ||
      pB <= 0 ||
      pB > 1
    ) {
      setError("Introduce probabilidades válidas entre 0 y 1. P(B) debe ser mayor que 0.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/probability/bayes", {
        p_b_given_a: pBGivenA,
        p_a: pA,
        p_b: pB,
      });

      const data = response.data?.data ?? response.data;
      const posterior = Number(data?.posterior);

      if (!Number.isFinite(posterior) || posterior < 0 || posterior > 1) {
        throw new Error("La API devolvió un resultado inválido.");
      }

      setResult(posterior);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        "No se pudo calcular. Comprueba la conexión con el servidor."
      );
    } finally {
      setLoading(false);
    }
  }

  const chartData =
    result === null
      ? []
      : [
          {
            name: "Probabilidad inicial",
            value: pA * 100,
            color: "#94a3b8",
          },
          {
            name: "Probabilidad posterior",
            value: result * 100,
            color: "#19b7d9",
          },
        ];

  const difference = result === null ? 0 : (result - pA) * 100;

  const interpretation =
    difference > 0.01
      ? "La evidencia incrementa la probabilidad del evento."
      : difference < -0.01
        ? "La evidencia reduce la probabilidad del evento."
        : "La probabilidad se mantiene prácticamente igual.";

  return (
    <div className="prob-page">
      <div className="pagehead">
        <div>
          <span className="eyebrow">ANALÍTICA EMPRESARIAL</span>
          <h1>Teorema de Bayes</h1>
          <p>Actualiza probabilidades a partir de nueva evidencia.</p>
        </div>
        <div className="bayes-status">
          <span className="bayes-status-dot" />
          Motor estadístico
        </div>
      </div>

      <div className="bayes-layout">
        <section className="panel bayes-form-panel">
          <div className="bayes-section-title">
            <div>
              <h3>Parámetros del análisis</h3>
              <p>Introduce valores entre 0 y 1.</p>
            </div>
            <span className="bayes-icon">ƒ</span>
          </div>

          <form onSubmit={calculate}>
            <label className="bayes-field">
              <span>Probabilidad condicional</span>
              <small>P(B|A)</small>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={pBGivenA}
                onChange={(e) => {
                  setPBGivenA(Number(e.target.value));
                  setResult(null);
                }}
                required
              />
            </label>

            <label className="bayes-field">
              <span>Probabilidad inicial</span>
              <small>P(A)</small>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={pA}
                onChange={(e) => {
                  setPA(Number(e.target.value));
                  setResult(null);
                }}
                required
              />
            </label>

            <label className="bayes-field">
              <span>Probabilidad de la evidencia</span>
              <small>P(B)</small>
              <input
                type="number"
                min="0.01"
                max="1"
                step="0.01"
                value={pB}
                onChange={(e) => {
                  setPB(Number(e.target.value));
                  setResult(null);
                }}
                required
              />
            </label>

            <div className="bayes-formula">
              <span>FÓRMULA APLICADA</span>
              <strong>P(A|B) = P(B|A) × P(A) / P(B)</strong>
            </div>

            {error && (
              <div className="alert" role="alert">
                {error}
              </div>
            )}

            <button
              className="primary bayes-calculate"
              type="submit"
              disabled={loading}
            >
              {loading ? "Calculando..." : "Calcular probabilidad"}
            </button>
          </form>
        </section>

        <section className="bayes-results">
          <div className="bayes-result-card">
            <div className="bayes-result-heading">
              <span>PROBABILIDAD POSTERIOR</span>
              <span className="bayes-result-symbol">P(A|B)</span>
            </div>

            <div className="bayes-result-number">
              {result === null ? "—" : `${(result * 100).toFixed(2)}%`}
            </div>

            <p>
              {result === null
                ? "Ejecuta el análisis para obtener el resultado."
                : "Probabilidad estimada después de considerar la evidencia."}
            </p>

            {result !== null && (
              <div className="bayes-progress">
                <div
                  style={{ width: `${result * 100}%` }}
                />
              </div>
            )}
          </div>

          <div className="bayes-metrics">
            <div className="bayes-metric">
              <span>Inicial P(A)</span>
              <strong>{(pA * 100).toFixed(1)}%</strong>
            </div>
            <div className="bayes-metric">
              <span>Evidencia P(B)</span>
              <strong>{(pB * 100).toFixed(1)}%</strong>
            </div>
            <div className="bayes-metric">
              <span>Condicional P(B|A)</span>
              <strong>{(pBGivenA * 100).toFixed(1)}%</strong>
            </div>
          </div>

          <div className="panel bayes-chart-panel">
            <div className="bayes-section-title">
              <div>
                <h3>Impacto de la evidencia</h3>
                <p>Comparación antes y después del análisis.</p>
              </div>
            </div>

            {result === null ? (
              <div className="bayes-chart-empty">
                <span className="bayes-empty-symbol">▥</span>
                <strong>Gráfico de resultados</strong>
                <span>Calcula una probabilidad para visualizar la comparación.</span>
              </div>
            ) : (
              <div className="bayes-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 15, right: 10, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid
                      stroke="#e8edf4"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#758197" }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fontSize: 11, fill: "#758197" }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                    />
                    <Tooltip
                      formatter={(value: any) => [
                        `${Number(value).toFixed(2)}%`,
                        "Probabilidad",
                      ]}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e4e9f2",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      name="Probabilidad"
                      radius={[7, 7, 0, 0]}
                      maxBarSize={90}
                    >
                      {chartData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {result !== null && (
              <div className="bayes-interpretation">
                <span className="bayes-interpretation-label">
                  <span className="bayes-status-dot" />
                  INTERPRETACIÓN
                </span>
                <strong>{interpretation}</strong>
                <span>
                  Variación respecto al valor inicial:{" "}
                  {difference > 0 ? "+" : ""}
                  {difference.toFixed(2)} puntos porcentuales.
                </span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
