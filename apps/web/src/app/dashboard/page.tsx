'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMyFamilies } from '@/lib/api'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [families, setFamilies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { router.push('/login'); return }
    getMyFamilies()
      .then(r => setFamilies(r.data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--sand)' }}>
      {/* Header */}
      <div style={{ background: 'var(--ink)', padding: '20px 20px 28px' }}>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>Chào mừng trở lại</p>
        <h1 style={{ color: '#fff', fontSize: 22, margin: '4px 0' }}>Họ Tộc</h1>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 11 }}>hotoc.net</p>
      </div>

      <div style={{ padding: 16 }}>
        {/* Dòng họ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={secLabel}>Dòng họ của tôi</span>
          <Link href="/family/create" style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 500, textDecoration: 'none' }}>+ Tạo mới</Link>
        </div>

        {families.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, textAlign: 'center', border: '1px dashed var(--sand3)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🌳</div>
            <p style={{ color: 'var(--ink2)', fontSize: 14, marginBottom: 16 }}>Chưa có dòng họ nào</p>
            <Link href="/family/create" style={{ ...btnStyle, display: 'inline-block', textDecoration: 'none' }}>Tạo dòng họ đầu tiên</Link>
          </div>
        ) : (
          families.map(f => (
            <Link key={f.id} href={`/family/${f.id}/tree`} style={{ textDecoration: 'none' }}>
              <div style={familyCard}>
                <div style={{ fontSize: 28, marginRight: 14 }}>🌳</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{f._count?.persons ?? 0} thành viên · {f.familyMembers?.[0]?.role === 'SUPER_ADMIN' ? 'Trưởng họ' : 'Thành viên'}</div>
                </div>
                <span style={{ color: 'var(--ink4)', fontSize: 18 }}>›</span>
              </div>
            </Link>
          ))
        )}

        {/* Quick test link */}
        <div style={{ marginTop: 16 }}>
          <span style={secLabel}>Thử nghiệm</span>
          <Link href="/family/seed-family-01/tree" style={{ textDecoration: 'none' }}>
            <div style={{ ...familyCard, background: 'var(--teal2)', borderColor: 'var(--teal)' }}>
              <div style={{ fontSize: 28, marginRight: 14 }}>🧪</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--teal)' }}>Ho Nguyen - Ha Tinh (Demo)</div>
                <div style={{ fontSize: 12, color: 'var(--teal)' }}>11 thành viên · 4 đời</div>
              </div>
              <span style={{ color: 'var(--teal)', fontSize: 18 }}>›</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sand)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>🌳</div>
        <p style={{ color: 'var(--ink3)', marginTop: 8 }}>Đang tải...</p>
      </div>
    </div>
  )
}

const secLabel: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--ink3)', letterSpacing: '.06em', textTransform: 'uppercase' }
const familyCard: React.CSSProperties = { background: '#fff', border: '1px solid var(--sand3)', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', marginTop: 8 }
const btnStyle: React.CSSProperties = { background: 'var(--ink)', color: '#fff', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600 }
