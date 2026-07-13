"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const URL = "https://ziwwmkyxkxdvdqmuzcad.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppd3dta3l4a3hkdmRxbXV6Y2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjAwNzIsImV4cCI6MjA5OTA5NjA3Mn0.ozKaLsZhKXujRcDRO_f0I3_zIZTxlIvI_vC9zCXK6Qo";

type Booking = { id:string; number:string; name:string; phone:string; slip_path:string; status:"pending"|"approved"; created_at:string };
type Session = { access_token:string; refresh_token:string; expires_in:number };

const apiHeaders = (token:string, extra:Record<string,string>={}) => ({ apikey:KEY, Authorization:`Bearer ${token}`, ...extra });

export default function AdminPage() {
  const [session,setSession] = useState<Session|null>(null);
  useEffect(() => { try { const saved=sessionStorage.getItem("gn_admin_session"); if(saved)setSession(JSON.parse(saved)); } catch{} },[]);
  if(!session) return <Login onLogin={s=>{sessionStorage.setItem("gn_admin_session",JSON.stringify(s));setSession(s)}}/>;
  return <Dashboard session={session} onLogout={()=>{sessionStorage.removeItem("gn_admin_session");setSession(null)}}/>;
}

function Login({onLogin}:{onLogin:(s:Session)=>void}){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{const r=await fetch(`${URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});if(!r.ok)throw new Error();onLogin(await r.json())}catch{setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")}finally{setBusy(false)}}
  return <main className="admin-shell login-shell"><section className="login-card"><div className="admin-logo">29</div><p className="admin-kicker">OWNER ACCESS</p><h1>เข้าสู่ระบบผู้ดูแล</h1><p>จัดการรายการจองและตรวจสอบสลิป</p><form onSubmit={submit}><label>อีเมล<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>รหัสผ่าน<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<div className="admin-error" role="alert">{error}</div>}<button className="admin-primary" disabled={busy}>{busy?"กำลังเข้าสู่ระบบ…":"เข้าสู่ระบบ"}</button></form><a href="/">← กลับหน้าเลือกรายการ</a></section></main>
}

function Dashboard({session,onLogout}:{session:Session;onLogout:()=>void}){
  const [rows,setRows]=useState<Booking[]>([]);const [loading,setLoading]=useState(true);const [filter,setFilter]=useState<"all"|"pending"|"approved">("all");const [error,setError]=useState("");const [slip,setSlip]=useState<{url:string;booking:Booking}|null>(null);
  const load=useCallback(async()=>{setError("");try{const r=await fetch(`${URL}/rest/v1/bookings?select=*&order=created_at.desc`,{headers:apiHeaders(session.access_token),cache:"no-store"});if(r.status===401){onLogout();return}if(!r.ok)throw new Error();setRows(await r.json())}catch{setError("โหลดรายการไม่สำเร็จ กรุณาลองใหม่")}finally{setLoading(false)}},[session.access_token,onLogout]);
  useEffect(()=>{load()},[load]);
  const visible=useMemo(()=>filter==="all"?rows:rows.filter(r=>r.status===filter),[rows,filter]);
  const pending=rows.filter(r=>r.status==="pending").length;
  async function approve(id:string){const r=await fetch(`${URL}/rest/v1/bookings?id=eq.${id}`,{method:"PATCH",headers:apiHeaders(session.access_token,{"Content-Type":"application/json",Prefer:"return=minimal"}),body:JSON.stringify({status:"approved"})});if(r.ok)load();else setError("อนุมัติไม่สำเร็จ")}
  async function remove(b:Booking){if(!confirm(`ยกเลิกการจองหมายเลข ${b.number}?`))return;const r=await fetch(`${URL}/rest/v1/bookings?id=eq.${b.id}`,{method:"DELETE",headers:apiHeaders(session.access_token,{Prefer:"return=minimal"})});if(r.ok){await fetch(`${URL}/storage/v1/object/booking-slips/${b.slip_path}`,{method:"DELETE",headers:apiHeaders(session.access_token)});load()}else setError("ลบรายการไม่สำเร็จ")}
  async function viewSlip(b:Booking){const r=await fetch(`${URL}/storage/v1/object/sign/booking-slips/${b.slip_path}`,{method:"POST",headers:apiHeaders(session.access_token,{"Content-Type":"application/json"}),body:JSON.stringify({expiresIn:300})});if(!r.ok)return setError("เปิดสลิปไม่สำเร็จ");const d=await r.json();setSlip({url:`${URL}/storage/v1${d.signedURL}`,booking:b})}
  function csv(){const safe=(v:string)=>`"${(/^[=+@-]/.test(v)?"'":"")+v.replaceAll('"','""')}"`;const data=[["วันที่","หมายเลข","ชื่อ","โทรศัพท์","สถานะ"],...rows.map(b=>[new Date(b.created_at).toLocaleString("th-TH"),b.number,b.name,b.phone,b.status])].map(r=>r.map(safe).join(",")).join("\r\n");const a=document.createElement("a");a.href=globalThis.URL.createObjectURL(new Blob(["\ufeff"+data],{type:"text/csv"}));a.download="bookings.csv";a.click();globalThis.URL.revokeObjectURL(a.href)}
  return <main className="admin-shell"><div className="admin-page"><header className="admin-header"><div><p className="admin-kicker">GOLDEN NUMBER 29</p><h1>รายการจอง</h1><span>ตรวจสอบสลิปและยืนยันหมายเลข</span></div><div className="admin-actions"><a href="/">หน้าลูกค้า</a><button onClick={onLogout}>ออกจากระบบ</button></div></header>
  <section className="admin-stats"><article><small>ทั้งหมด</small><strong>{rows.length}</strong></article><article><small>รอยืนยัน</small><strong>{pending}</strong></article><article><small>ยืนยันแล้ว</small><strong>{rows.length-pending}</strong></article></section>
  <section className="admin-table-card"><div className="admin-toolbar"><div>{(["all","pending","approved"] as const).map(f=><button key={f} className={filter===f?"active":""} onClick={()=>setFilter(f)}>{f==="all"?"ทั้งหมด":f==="pending"?"รอยืนยัน":"ยืนยันแล้ว"}</button>)}</div><button className="csv" onClick={csv}>ดาวน์โหลด CSV</button></div>{error&&<p className="admin-error">{error}</p>}{loading?<div className="empty">กำลังโหลด…</div>:visible.length===0?<div className="empty">ยังไม่มีรายการในหมวดนี้</div>:<div className="booking-list">{visible.map(b=><article key={b.id}><div className={`booking-number ${b.status}`}>{b.number}</div><div className="booking-info"><strong>{b.name}</strong><span>{b.phone} · {new Date(b.created_at).toLocaleString("th-TH")}</span></div><span className={`status ${b.status}`}>{b.status==="approved"?"ยืนยันแล้ว":"รอยืนยัน"}</span><div className="row-actions"><button onClick={()=>viewSlip(b)}>ดูสลิป</button>{b.status==="pending"&&<button className="approve" onClick={()=>approve(b.id)}>อนุมัติ</button>}<button className="delete" onClick={()=>remove(b)} aria-label={`ลบหมายเลข ${b.number}`}>ลบ</button></div></article>)}</div>}</section></div>
  {slip&&<div className="slip-backdrop" onMouseDown={()=>setSlip(null)}><section className="slip-modal" onMouseDown={e=>e.stopPropagation()}><button onClick={()=>setSlip(null)} aria-label="ปิด">×</button><h2>สลิปหมายเลข {slip.booking.number}</h2><img src={slip.url} alt={`สลิปของ ${slip.booking.name}`}/><p><b>{slip.booking.name}</b><br/>{slip.booking.phone}</p></section></div>}</main>
}
