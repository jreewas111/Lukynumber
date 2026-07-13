"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SUPABASE_URL = "https://ziwwmkyxkxdvdqmuzcad.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppd3dta3l4a3hkdmRxbXV6Y2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjAwNzIsImV4cCI6MjA5OTA5NjA3Mn0.ozKaLsZhKXujRcDRO_f0I3_zIZTxlIvI_vC9zCXK6Qo";

type NumberState = { number: string; status: "pending" | "approved" };
type BookingForm = { name: string; phone: string; slip: File | null };

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

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/public_number_status?select=number,status`, { headers: headers(), cache: "no-store" });
      if (!res.ok) throw new Error("not-ready");
      setTaken(await res.json());
    } catch {
      setNotice("ระบบกำลังรอเปิดฐานข้อมูล หมายเลขทั้งหมดจะแสดงเป็นว่างชั่วคราว");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  const takenSet = useMemo(() => new Set(taken.map(x => x.number)), [taken]);

  return (
    <main className="site-shell">
      <Decor />
      <div className="page">
        <header className="hero">
          <div className="announcement">★ ลุ้นรับรางวัลมูลค่ากว่า 1,000 บาท ★</div>
          <p className="eyebrow">LUCKY NUMBER COLLECTION</p>
          <h1>เบอร์เงิน <span>29</span></h1>
          <p className="subtitle">เลือกเบอร์นำโชคที่ชอบ แล้วจองได้เลย</p>
        </header>

        <section className="summary" aria-label="ข้อมูลรางวัล">
          <article><span className="emoji">💰</span><strong>29 บาท</strong><small>ราคาต่อเบอร์</small></article>
          <article><span className="emoji">🏆</span><strong>1,000 บาท</strong><small>รางวัล 2 ตัวล่าง</small></article>
          <article><span className="emoji">🎁</span><strong>150 บาท</strong><small>รางวัลปลอบใจ 2 ตัวบน</small></article>
        </section>

        <section className="bank-card">
          <div className="bank-mark">K</div>
          <div><small>โอนเงินมาที่บัญชีธนาคารกสิกรไทย</small><strong>056-165-0-3402</strong><span>จีรวัสส์ สระทองนวน</span></div>
        </section>
        <p className="bank-note">✓ โอนแล้วอย่าลืมอัปโหลดสลิปในขั้นตอนการจองนะคะ</p>

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
        <footer>© 2026 แผงเบอร์เงิน · ข้อมูลของคุณใช้เพื่อยืนยันการจองเท่านั้น</footer>
      </div>
      {selected && <BookingDialog number={selected} onClose={() => setSelected(null)} onSuccess={() => { setSelected(null); refresh(); }} />}
    </main>
  );
}

function BookingDialog({ number, onClose, onSuccess }: { number: string; onClose: () => void; onSuccess: () => void }) {
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
        <p className="form-intro">กรอกข้อมูลและแนบสลิปโอนเงิน 29 บาท</p>
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
