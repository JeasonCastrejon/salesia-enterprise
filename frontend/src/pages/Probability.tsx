

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
  Legend,
} from "recharts";

type BayesResult = {
  posterior: number;
};

export function Probability() {
  // P(B|A): probabilidad de observar B cuando ocurre A
  const [likelihood, setLikelihood] = useState(0.8);

  // P(A): probabilidad previa del evento A
  const [prior, setPrior] = useState(0.3);

  // P(B): probabilidad total de observar la evidencia B
  const [evidence, setEvidence] = useState(0.5);

  const [result, setResult] = useState<BayesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const numerator = likelihood * prior;
  const preview = evidence > 0 ? numerator / evidence : 0;

  const valid =
    [likelihood, prior, evidence].every(
      (v) => Number.isFinite(v) && v >= 0 && v <= 1
    ) &&
    evidence > 0 &&
    numerator <= evidence;

  async function calculate() {
    setError("");
    setResult(null);

    if (!valid) {
      setError(
        "Revisa los valores. Las probabilidades deben estar entre 0 y 1, P(B) debe ser mayor que cero y P(B|A) × P(A) no puede superar P(B)."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/probability/bayes", {
        p_b_given_a: likelihood,
        p_a: prior,
        p_b: evidence,
      });

      const data = response.data?.data ?? response.data;
      const posterior = Number(data.posterior);

      if (!Number.isFinite(posterior) || posterior < 0 || posterior > 1) {
        throw new Error("La API devolvió un resultado no válido.");
      }

      setResult({ posterior });
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "No se pudo calcular Bayes. Comprueba la conexión con el backend."
      );
    } finally {
      setLoading(false);
    }
  }

  const posterior = result?.posterior ?? preview;

  const chartData = [
    { name: "Probabilidad previa", valor: prior * 100 },
    { name: "Evidencia P(B)", valor: evidence * 100 },
    { name: "Verosimilitud", valor: likelihood * 100 },
    { name: "Posterior P(A|B)", valor: posterior * 100 },
  ];

  const difference = result
    ? (result.posterior - prior) * 100
    : 0;

  return (
    <div>
      <div className="pagehead">
        <div>
          <span className="eyebrow">ANALÍTICA AVANZADA</span>
          <h1>Probabilidad empresarial</h1>
          <p>
            Evalúa escenarios comerciales utilizando el Teorema de Bayes.
          </p>
        </div>
      </div>

      <div className="bayes-intro">
        <div>
          <span className="eyebrow">MOTOR DE PROBABILIDAD</span>
          <h2>Actualización de probabilidades</h2>
          <p>
            Introduce tus estimaciones y observa cómo cambia la probabilidad
            de un evento cuando se incorpora nueva evidencia.
          </p>
        </div>
        <div className="bayes-formula">
          P(A|B) = P(B|A) × P(A) / P(B)
        </div>
      </div>

      <div className="bayes-kpis">
        <div className="bayes-kpi">
          <span>Probabilidad previa</span>
          <strong>{(prior * 100).toFixed(1)}%</strong>
          <small>Estimación inicial de A</small>
        </div>

        <div className="bayes-kpi">
          <span>Evidencia observada</span>
          <strong>{(evidence * 100).toFixed(1)}%</strong>
          <small>Probabilidad de B</small>
        </div>

        <div className="bayes-kpi">
          <span>Probabilidad posterior</span>
          <strong>
            {result ? (result.posterior * 100).toFixed(2) + "%" : "—"}
          </strong>
          <small>
            {result ? "Resultado calculado por la API" : "Pendiente de cálculo"}
          </small>
        </div>
      </div>

      <div className="bayes-layout">
        <section className="panel bayes-config">
          <span className="eyebrow">CONFIGURACIÓN DEL ESCENARIO</span>
          <h3>Parámetros de análisis</h3>

          <p className="bayes-help">
            Ejemplo: A = un cliente compra; B = el cliente responde
            a una campaña comercial.
          </p>

          <label className="bayes-field">
            <span>
              P(B|A) <small>Verosimilitud</small>
            </span>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={likelihood}
              onChange={(e) => {
                setLikelihood(Number(e.target.value));
                setResult(null);
              }}
            />
            <small>
              Probabilidad de observar B cuando ocurre A.
            </small>
          </label>

          <label className="bayes-field">
            <span>
              P(A) <small>Probabilidad previa</small>
            </span>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={prior}
              onChange={(e) => {
                setPrior(Number(e.target.value));
                setResult(null);
              }}
            />
            <small>
              Probabilidad inicial de que ocurra A.
            </small>
          </label>

          <label className="bayes-field">
            <span>
              P(B) <small>Evidencia total</small>
            </span>
            <input
              type="number"
              min="0.01"
              max="1"
              step="0.01"
              value={evidence}
              onChange={(e) => {
                setEvidence(Number(e.target.value));
                setResult(null);
              }}
            />
            <small>
              Probabilidad total de observar B; debe ser mayor que cero.
            </small>
          </label>

          {error && <div className="bayes-error">{error}</div>}

          <button
            className="primary bayes-calculate"
            onClick={calculate}
            disabled={loading}
          >
            {loading ? "Calculando..." : "Calcular y analizar"}
          </button>

          <small className="bayes-footnote">
            Los valores deben representar probabilidades coherentes
            con el mismo escenario.
          </small>
        </section>

        <section className="panel bayes-chart-panel">
          <div className="bayes-section-heading">
            <div>
              <span className="eyebrow">VISUALIZACIÓN</span>
              <h3>Comparativa de probabilidades</h3>
            </div>
            <span className="bayes-tag">Escala 0–100%</span>
          </div>

          <div className="bayes-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 12, left: 0, bottom: 15 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7edf5" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#68778e" }}
                  angle={-12}
                  textAnchor="end"
                  height={65}
                  interval={0}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: "#68778e" }}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(2)}%`,
                    "Probabilidad",
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="valor"
                  name="Probabilidad"
                  fill="#159bb9"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={58}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="bayes-chart-note">
            La probabilidad posterior se confirma al pulsar
            «Calcular y analizar». Antes de calcular, el gráfico muestra
            una estimación local basada en los parámetros introducidos.
          </p>
        </section>
      </div>

      <section className="panel bayes-analysis">
        <span className="eyebrow">INTERPRETACIÓN DEL RESULTADO</span>
        <h3>Conclusión del análisis</h3>

        {!result ? (
          <p>
            Configura el escenario y calcula el resultado para obtener
            una interpretación cuantitativa.
          </p>
        ) : (
          <>
            <div className="bayes-result-number">
              {(result.posterior * 100).toFixed(2)}%
            </div>

            <p>
              Dadas las probabilidades introducidas, la probabilidad
              posterior de A cuando se observa B es{" "}
              <strong>{(result.posterior * 100).toFixed(2)}%</strong>.
            </p>

            <div className="bayes-comparison">
              <div>
                <small>Antes de la evidencia</small>
                <strong>{(prior * 100).toFixed(2)}%</strong>
              </div>
              <div>
                <small>Después de la evidencia</small>
                <strong>{(result.posterior * 100).toFixed(2)}%</strong>
              </div>
              <div>
                <small>Variación</small>
                <strong>
                  {difference > 0 ? "+" : ""}
                  {difference.toFixed(2)} puntos porcentuales
                </strong>
              </div>
            </div>

            <div className="bayes-business-note">
              <strong>Aplicación empresarial</strong>
              <p>
                Utiliza este resultado como apoyo para evaluar campañas,
                segmentación de clientes o escenarios de conversión.
                La utilidad de la conclusión depende de que las
                probabilidades de entrada procedan de datos fiables.
                Este cálculo, por sí solo, no demuestra causalidad
                ni predice automáticamente una compra real.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
