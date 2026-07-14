-- Run once in Supabase SQL Editor to enable website settings.
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  page_title text not null default 'เบอร์เงิน 29',
  page_subtitle text not null default 'เลือกเบอร์นำโชคที่ชอบ แล้วจองได้เลย',
  announcement_text text not null default 'ลุ้นรับรางวัลมูลค่ากว่า 1,000 บาท',
  price_per_number text not null default '29',
  prize1_amount text not null default '1,000',
  prize1_label text not null default 'รางวัล 2 ตัวล่าง',
  prize2_amount text not null default '150',
  prize2_label text not null default 'รางวัลปลอบใจ 2 ตัวบน',
  bank_name text not null default 'ธนาคารกสิกรไทย',
  bank_number text not null default '056-165-0-3402',
  bank_account_name text not null default 'จีรวัสส์ สระทองนวน',
  bank_note text not null default 'โอนแล้วอย่าลืมอัปโหลดสลิปในขั้นตอนการจองนะคะ',
  footer_text text not null default '© 2026 แผงเบอร์เงิน · ข้อมูลของคุณใช้เพื่อยืนยันการจองเท่านั้น',
  background_type text not null default 'gradient' check (background_type in ('gradient','solid')),
  background_color text not null default '#fff2f8',
  gradient_from text not null default '#fff2f8',
  gradient_to text not null default '#eaf9f5',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;
alter table public.site_settings enable row level security;

drop policy if exists "public reads site settings" on public.site_settings;
create policy "public reads site settings" on public.site_settings
for select to anon, authenticated using (true);

drop policy if exists "admin updates site settings" on public.site_settings;
create policy "admin updates site settings" on public.site_settings
for update to authenticated
using (lower(auth.jwt() ->> 'email') = 'jreewas000@gmail.com')
with check (lower(auth.jwt() ->> 'email') = 'jreewas000@gmail.com');

grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
