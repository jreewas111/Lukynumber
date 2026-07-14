"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SUPABASE_URL = "https://ziwwmkyxkxdvdqmuzcad.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppd3dta3l4a3hkdmRxbXV6Y2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjAwNzIsImV4cCI6MjA5OTA5NjA3Mn0.ozKaLsZhKXujRcDRO_f0I3_zIZTxlIvI_vC9zCXK6Qo";

type NumberState = { number: string; status: "pending" | "approved" };
type BookingForm = { name: string; phone: string; slip: File | null };
type SiteSettings = {
  page_title: string; page_subtitle: string; announcement_text: string;
  price_per_number: string; prize1_amount: string; prize1_label: string;
  prize2_amount: string; prize2_label: string; bank_name: string;
  bank_number: string; bank_account_name: string; bank_note: string;
  footer_text: string; background_type: "gradient" | "solid";
  background_color: string; gradient_from: string; gradient_to: string;
};

const DEFAULT_SETTINGS: SiteSettings = {
  page_title:"เบอร์เงิน 29", page_subtitle:"เลือกเบอร์นำโชคที่ชอบ แล้วจองได้เลย",
  announcement_text:"ลุ้นรับรางวัลมูลค่ากว่า 1,000 บาท", price_per_number:"29",
  prize1_amount:"1,000", prize1_label:"รางวัล 2 ตัวล่าง", prize2_amount:"150",
  prize2_label:"รางวัลปลอบใจ 2 ตัวบน", bank_name:"ธนาคารกสิกรไทย",
  bank_number:"056-165-0-3402", bank_account_name:"จีรวัสส์ สระทองนวน",
  bank_note:"โอนแล้วอย่าลืมอัปโหลดสลิปในขั้นตอนการจองนะคะ",
  footer_text:"© 2026 แผงเบอร์เงิน · ข้อมูลของคุณใช้เพื่อยืนยันการจองเท่านั้น",
  background_type:"gradient", background_color:"#fff2f8", gradient_from:"#fff2f8", gradient_to:"#eaf9f5"
};

const headers = (token?: string) => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
});

function two(n: number) { return String(n).padStart(2, "0"); }

export default function Home() {
  const [taken, setTaken] = useState<NumberState[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  const refresh = useCallback(async () => {
    try {
      const [numberRes,settingsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/public_number_status?select=number,status`, { headers: headers(), cache: "no-store" }),
        fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=*`, { headers: headers(), cache: "no-store" })
      ]);
      if (!numberRes.ok) throw new Error("not-ready");
      setTaken(await numberRes.json());
      if(settingsRes.ok){ const data=await settingsRes.json(); if(data[0]) setSettings({...DEFAULT_SETTINGS,...data[0]}); }
    } catch {
      setNotice("ระบบกำลังรอเปิดฐานข้อมูล หมายเลขทั้งหมดจะแสดงเป็นว่างชั่วคราว");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  const takenSet = useMemo(() => new Set(taken.map(x => x.number)), [taken]);

  const background = settings.background_type === "solid"
    ? settings.background_color
    : `linear-gradient(145deg,${settings.gradient_from},${settings.gradient_to})`;
  return (
    <main className="site-shell" style={{background}}>
      <Decor />
      <div className="page">
        <header className="hero">
          <div className="announcement">★ {settings.announcement_text} ★</div>
          <p className="eyebrow">LUCKY NUMBER COLLECTION</p>
          <h1>{settings.page_title}</h1>
          <p className="subtitle">{settings.page_subtitle}</p>
        </header>

        <section className="summary" aria-label="ข้อมูลรางวัล">
          <article><span className="emoji">💰</span><strong>{settings.price_per_number} บาท</strong><small>ราคาต่อเบอร์</small></article>
          <article><span className="emoji">🏆</span><strong>{settings.prize1_amount} บาท</strong><small>{settings.prize1_label}</small></article>
          <article><span className="emoji">🎁</span><strong>{settings.prize2_amount} บาท</strong><small>{settings.prize2_label}</small></article>
        </section>

        <section className="bank-card">
          <div className="bank-mark">K</div>
          <div><small>โอนเงินมาที่บัญชี{settings.bank_name}</small><strong>{settings.bank_number}</strong><span>{settings.bank_account_name}</span></div>
        </section>
        <p className="bank-note">✓ {settings.bank_note}</p>

        <section className="number-panel">
          <div className="panel-heading"><div><p>เลือกหมายเลข</p><h2>เบอร์ไหนถูกใจคุณ?</h2></div><span>{99 - takenSet.size} เบอร์ว่าง</span></div>
          {notice && <p className="system-notice" role="status">{notice}</p>}
          <div className="number-grid" aria-busy={loading}>
            {Array.from({ length: 99 }, (_, i) => two(i + 1)).map((number, i) => {
              const unavailable = takenSet.has(number);
              return <button key={number} className={`number n${i % 8}`} disabled={unavailable || loading} onClick={() => setSelected(number)} aria-label={unavailable ? `หมายเลข ${number} จองแล้ว` : `เลือกหมายเลข ${number}`}><b>{number}</b>{unavailable && <small>จองแล้ว</small>}</button>;
            })}
          </div>
          <div className="legend"><span><i className="free" />ว่าง</span><span><i className="taken" />จองแล้ว ({takenSet.size})</span></div>
        </section>
        <footer>{settings.footer_text}</footer>
      </div>
      {selected && <BookingDialog number={selected} price={settings.price_per_number} onClose={() => setSelected(null)} onSuccess={() => { setSelected(null); refresh(); }} />}
    </main>
  );
}

function BookingDialog({ number, price, onClose, onSuccess }: { number: string; price:string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<BookingForm>({ name: "", phone: "", slip: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!form.name.trim() || !/^0\d{9}$/.test(form.phone) || !form.slip) return setError("กรุณากรอกข้อมูลและแนบสลิปให้ครบ");
    if (form.slip.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(form.slip.type)) return setError("รองรับ JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB");
    setBusy(true);
    try {
      const id = crypto.randomUUID();
      const ext = form.slip.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${id}/slip.${ext}`;
      const upload = await fetch(`${SUPABASE_URL}/storage/v1/object/booking-slips/${path}`, { method: "POST", headers: { ...headers(), "Content-Type": form.slip.type, "x-upsert": "false" }, body: form.slip });
      if (!upload.ok) throw new Error("upload");
      const create = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, { method: "POST", headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ id, number, name: form.name.trim(), phone: form.phone, slip_path: path }) });
      if (create.status === 409) throw new Error("duplicate");
      if (!create.ok) throw new Error("create");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error && e.message === "duplicate" ? "หมายเลขนี้เพิ่งถูกจอง กรุณาเลือกหมายเลขอื่น" : "ยังบันทึกไม่ได้ กรุณาลองใหม่อีกครั้ง");
    } finally { setBusy(false); }
  }

  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="booking-title" onMouseDown={e => e.stopPropagation()}>
      <button className="dialog-close" onClick={onClose} aria-label="ปิด">×</button>
      <div className="dialog-top"><div>{number}</div><span><small>คุณเลือกเบอร์</small><b id="booking-title">หมายเลข {number}</b></span></div>
      <form onSubmit={submit}>
        <p className="form-intro">กรอกข้อมูลและแนบสลิปโอนเงิน {price} บาท</p>
        <label>ชื่อ–นามสกุล<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoComplete="name" placeholder="เช่น สมชาย ใจดี" /></label>
        <label>เบอร์ติดต่อ<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} inputMode="numeric" autoComplete="tel" placeholder="0812345678" /></label>
        <label>สลิปโอนเงิน<button type="button" className="file-button" onClick={() => fileRef.current?.click()}>{form.slip ? `✓ ${form.slip.name}` : "＋ เลือกรูปสลิป"}</button><input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setForm({ ...form, slip: e.target.files?.[0] || null })} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="submit" disabled={busy}>{busy ? "กำลังบันทึก…" : "ยืนยันการจอง"}</button>
      </form>
    </section>
  </div>;
}

function Decor() { return <div className="decor" aria-hidden="true"><i>✦</i><i>●</i><i>✦</i><i>●</i><i>✦</i></div>; }
