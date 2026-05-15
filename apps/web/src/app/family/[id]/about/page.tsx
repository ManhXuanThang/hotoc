'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import { getFamilyAbout } from '@/lib/api'

export default function FamilyAboutPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const familyId = params.id
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login')
      return
    }
    getFamilyAbout(familyId).then((res) => setData(res.data)).finally(() => setLoading(false))
  }, [familyId, router])

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Đang tải...</main>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar familyId={familyId} />
      <div className="app-layout">
        <Sidebar familyId={familyId} familyName={data?.name ?? 'Dòng họ'} memberCount={data?.stats?.totalMembers ?? 0} />
        <main className="main-content" style={{ overflow: 'auto' }}>
          <div style={{ maxWidth: 960, width: '100%', padding: 20, margin: '0 auto 80px' }}>
            <section style={heroStyle}>
              <div style={{ color: 'rgba(255,255,255,.62)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Về dòng họ</div>
              <h1 style={{ color: '#fff', fontSize: 34, marginBottom: 8 }}>{data?.name}</h1>
              <p style={{ color: 'rgba(255,255,255,.74)', maxWidth: 680 }}>{data?.description || 'Lưu giữ lịch sử, thế hệ và những kết nối quan trọng của dòng họ.'}</p>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, margin: '14px 0' }}>
              <Stat label="Tổng thành viên" value={data?.stats?.totalMembers ?? 0} />
              <Stat label="Số đời" value={data?.stats?.generations ?? 0} />
              <Stat label="Còn sống" value={data?.stats?.living ?? 0} />
              <Stat label="Đã mất" value={data?.stats?.passed ?? 0} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <section style={cardStyle}>
                <h2 style={{ fontSize: 20, marginBottom: 12 }}>Quê gốc</h2>
                <p style={{ color: 'var(--ink2)' }}>
                  {[data?.originCommune, data?.originDistrict, data?.originProvince].filter(Boolean).join(', ') || 'Chưa cập nhật'}
                </p>
              </section>
              <section style={cardStyle}>
                <h2 style={{ fontSize: 20, marginBottom: 12 }}>Phân bố nơi ở</h2>
                {data?.locations?.length ? data.locations.map((item: any) => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                    <span>{item.name}</span><strong>{item.count}</strong>
                  </div>
                )) : <p style={{ color: 'var(--ink3)' }}>Chưa có dữ liệu nơi ở.</p>}
              </section>
            </div>

            <section style={{ ...cardStyle, marginTop: 14 }}>
              <h2 style={{ fontSize: 20, marginBottom: 12 }}>Dòng thời gian</h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={pillStyle}>Đời {data?.stats?.firstGeneration ?? '?'}</span>
                <span style={{ color: 'var(--ink3)' }}>→</span>
                <span style={pillStyle}>Hiện tại: đời {data?.stats?.latestGeneration ?? '?'}</span>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 28, fontFamily: 'Lora, serif', color: 'var(--primary)' }}>{value}</div>
      <div style={{ color: 'var(--ink3)', fontSize: 12 }}>{label}</div>
    </div>
  )
}

const heroStyle: React.CSSProperties = {
  background: 'var(--topbar)',
  borderRadius: 14,
  padding: 28,
}
const cardStyle: React.CSSProperties = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }
const pillStyle: React.CSSProperties = { background: 'var(--primary2)', color: 'var(--primary)', borderRadius: 999, padding: '8px 12px', fontWeight: 700 }
