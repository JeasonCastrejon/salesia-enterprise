import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export function Login() {
  const [email,setEmail]=useState("admin@salesia.com");
  const [password,setPassword]=useState("admin123");
  const [error,setError]=useState("");
  const navigate=useNavigate();
  async function submit(e:any){
    e.preventDefault(); setError("");
    try { const r=await api.post("/auth/login",{email,password}); localStorage.setItem("salesia_token",r.data.access_token); navigate("/"); }
    catch(e:any){ setError(e.response?.data?.detail || "No se pudo iniciar sesión"); }
  }
  return <div className="loginpage">
    <div className="loginvisual"><div className="logoBig">S</div><h1>SalesIA Enterprise</h1><p>Gestión comercial + analítica estadística en una sola plataforma.</p><div className="miniStats"><span><b>Ventas</b> Operación</span><span><b>Analytics</b> Semana 07</span><span><b>Insights</b> Decisiones</span></div></div>
    <form className="loginform" onSubmit={submit}><span className="eyebrow">ACCESO SEGURO</span><h2>Bienvenido</h2><p>Ingresa a tu centro empresarial.</p>
      <label>Correo<input value={email} onChange={e=>setEmail(e.target.value)} type="email"/></label>
      <label>Contraseña<input value={password} onChange={e=>setPassword(e.target.value)} type="password"/></label>
      {error && <div className="alert">{error}</div>}
      <button className="primary full">Iniciar sesión</button>
      <small>Demo: admin@salesia.com / admin123</small>
    </form>
  </div>
}
