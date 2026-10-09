import { useEffect, useState } from "react";
import { api } from "../api";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export function Dashboard(){
 const [d,setD]=useState<any>(null); const [series,setSeries]=useState<any[]>([]); const [insights,setInsights]=useState<any[]>([]);
 useEffect(()=>{api.get("/dashboard/summary").then(r=>setD(r.data));api.get("/dashboard/series").then(r=>setSeries(r.data));api.get("/insights").then(r=>setInsights(r.data));},[]);
 return <div>
  <div className="pagehead"><div><span className="eyebrow">RESUMEN EJECUTIVO</span><h1>Dashboard</h1><p>Visión general del negocio y sus indicadores.</p></div></div>
  <div className="cards">
   <Card label="Ingresos" value={`S/ ${d?.revenue?.toFixed(2) || "0.00"}`} note="Ventas registradas"/>
   <Card label="Transacciones" value={d?.sales_count || 0} note="Operaciones"/>
   <Card label="Ticket promedio" value={`S/ ${d?.average_ticket?.toFixed(2) || "0.00"}`} note="Media"/>
   <Card label="Clientes" value={d?.customers || 0} note="Registrados"/>
  </div>
  <div className="grid2">
   <div className="panel"><h3>Evolución de ventas</h3><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={series}><XAxis dataKey="date"/><YAxis/><Tooltip/><Line type="monotone" dataKey="sales" strokeWidth={3}/></LineChart></ResponsiveContainer></div></div>
   <div className="panel"><h3>Perspectivas</h3>{insights.map((x,i)=><div className="insight" key={i}><b>{x.title}</b><p>{x.message}</p><small>{x.evidence}</small></div>)}</div>
  </div>
 </div>
}
function Card({label,value,note}:any){return <div className="card"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
