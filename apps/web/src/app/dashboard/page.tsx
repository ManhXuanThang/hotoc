'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMyFamilies } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [families, setFamilies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }
    getMyFamilies()
      .then((res) => setFamilies(res.data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  const stats = useMemo(() => {
    const members = families.reduce((sum, family) => sum + (family._count?.persons ?? 0), 0)
    const adminFamilies = families.filter((family) => ['SUPER_ADMIN', 'BRANCH_ADMIN'].includes(family.familyMembers?.[0]?.role)).length
    return { members, adminFamilies }
  }, [families])

  if (loading) return <LoadingScreen />

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <section style={{ background: 'var(--topbar)', color: '#fff', padding: '28px 20px 34px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 13, marginBottom: 6 }}>Chào mừng trở lại</div>
              <h1 style={{ color: '#fff', fontSize: 30, marginBottom: 6 }}>Họ Tộc</h1>
              <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 13 }}>hotoc.net</div>
            </div>
            <Link href="/family/create" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Tạo dòng họ
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 22 }}>
            <Stat value={families.length} label="Dòng họ" />
            <Stat value={stats.members} label="Thành viên" />
            <Stat value={stats.adminFamilies} label="Đang quản trị" />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '22px 16px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, .9fr)', gap: 16 }}>
          <div>
            <SectionHeader title="Dòng họ của tôi" />
            {families.length === 0 ? (
              <EmptyState />
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {families.map((family) => (
                  <FamilyCard key={family.id} family={family} />
                ))}
              </div>
            )}
          </div>

          <aside>
            <SectionHeader title="Việc cần làm" />
            <div style={sideCardStyle}>
              <Action href="/family/seed-family-01/tree" title="Mở cây demo" desc="Kiểm tra dữ liệu 4 đời, 11 người." />
              <Action href="/family/seed-family-01/add" title="Thêm thành viên" desc="Bổ sung người mới vào cây gia phả." />
              <Action href="/family/seed-family-01/admin" title="Duyệt thay đổi" desc="Xem các đề xuất đang chờ xử lý." />
              <Action href="/family/seed-family-01/reminders" title="Nhắc giỗ" desc="Theo dõi ngày giỗ sắp tới." />
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

function FamilyCard({ family }: { family: any }) {
  const role = family.familyMembers?.[0]?.role
  const roleLabel = role === 'SUPER_ADMIN' ? 'Trưởng họ' : role === 'BRANCH_ADMIN' ? 'Quản trị nhánh' : 'Thành viên'
  return (
    <div style={familyCardStyle}>
      <Link href={`/family/${family.id}/tree`} style={{ textDecoration: 'none', flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{family.name}</div>
        <div style={{ fontSize: 13, color: 'var(--ink3)' }}>
          {family._count?.persons ?? 0} thành viên · {roleLabel}
        </div>
      </Link>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link href={`/family/${family.id}/add`} className="btn btn-outline" style={{ textDecoration: 'none' }}>Thêm</Link>
        <Link href={`/family/${family.id}/invite`} className="btn btn-outline" style={{ textDecoration: 'none' }}>Mời</Link>
        <Link href={`/family/${family.id}/admin`} className="btn btn-primary" style={{ textDecoration: 'none' }}>Quản lý</Link>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 26, fontFamily: 'Lora, serif', color: '#fff' }}>{value}</div>
      <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>{label}</div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <div style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
}

function Action({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} style={{ display: 'block', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ color: 'var(--ink)', fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{title}</div>
      <div style={{ color: 'var(--ink3)', fontSize: 13, lineHeight: 1.5 }}>{desc}</div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div style={{ background: 'var(--card)', border: '1px dashed var(--border2)', borderRadius: 14, padding: 28, textAlign: 'center' }}>
      <h2 style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>Chưa có dòng họ nào</h2>
      <p style={{ color: 'var(--ink3)', fontSize: 14, marginBottom: 18 }}>Tạo dòng họ đầu tiên để bắt đầu số hóa gia phả.</p>
      <Link href="/family/create" className="btn btn-primary" style={{ textDecoration: 'none' }}>Tạo dòng họ đầu tiên</Link>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
      <p style={{ color: 'var(--ink3)', fontSize: 14 }}>Đang tải...</p>
    </div>
  )
}

const familyCardStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  flexWrap: 'wrap',
}

const sideCardStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '4px 16px',
}
