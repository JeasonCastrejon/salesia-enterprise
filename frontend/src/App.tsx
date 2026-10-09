import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { api } from "./api";
import "./index.css";
import { Dashboard } from "./pages/Dashboard";
import { Customers } from "./pages/Customers";
import { Products } from "./pages/Products";
import { Sales } from "./pages/Sales";
import { Analytics } from "./pages/Analytics";
import { Probability } from "./pages/Probability";
import { Reports } from "./pages/Reports";
import { Login } from "./pages/Login";

function Layout() {
  const navigate = useNavigate();
  const [me, setMe] = useState<any>(null);
  useEffect(() => { api.get("/auth/me").then(r=>setMe(r.data)).catch(()=>logout()); }, []);
  function logout() { localStorage.removeItem("salesia_token"); navigate("/login"); }
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brandmark">S</div><div><b>SalesIA</b><small>Enterprise</small></div></div>
      <nav>
        <NavLink to="/">▦ Dashboard</NavLink>
        <NavLink to="/customers">♙ Clientes</NavLink>
        <NavLink to="/products">▣ Productos</NavLink>
        <NavLink to="/sales">▤ Ventas</NavLink>
        <NavLink to="/analytics">◈ Analytics</NavLink>
        <NavLink to="/probability">⌁ Probabilidad</NavLink>
        <NavLink to="/reports">▤ Reportes</NavLink>
      </nav>
      <div className="sidebottom"><small>Semana 07</small><span>Estadística aplicada</span></div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div><span className="eyebrow">PLATAFORMA EMPRESARIAL</span><h2>Centro de gestión</h2></div>
        <div className="userbox"><div className="avatar">{me?.name?.[0] || "A"}</div><div><b>{me?.name || "Cargando..."}</b><small>{me?.role || ""}</small></div><button onClick={logout}>Salir</button></div>
      </header>
      <section className="content"><Routes>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/customers" element={<Customers/>}/>
        <Route path="/products" element={<Products/>}/>
        <Route path="/sales" element={<Sales/>}/>
        <Route path="/analytics" element={<Analytics/>}/>
        <Route path="/probability" element={<Probability/>}/>
        <Route path="/reports" element={<Reports/>}/>
      </Routes></section>
    </main>
  </div>
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<Login/>}/>
    <Route path="/*" element={localStorage.getItem("salesia_token") ? <Layout/> : <Navigate to="/login" replace/>}/>
  </Routes>
}
