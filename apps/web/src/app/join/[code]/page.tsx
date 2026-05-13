'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getInvitePreview, joinFamilyByCode } from '@/lib/api'

export default function JoinByCodePage() {
  const router = useRouter()
  const params = useParams<{ code: string }>()
  const code = params.code
  const [family, setFamily] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getInvitePreview(code)
      .then((res) => setFamily(res.data))
      .catch((e) => setError(e.response?.data?.message || 'Link mời không hợp lệ hoặc đã hết hạn'))
      .finally(() => setLoading(false))
  }, [code])

  const join = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      localStorage.setItem('pendingInviteCode', code)
      router.push('/login')
      return
    }
    setJoining(true)
    setError('')
    try {
      const res = await joinFamilyByCode(code)
      localStorage.removeItem('pendingInviteCode')
      router.push(`/family/${res.data.familyId}/tree`)
    } catch (e: any) {
      const message = e.response?.data?.message || 'Không thể tham gia dòng họ'
      if (e.response?.status === 409 && family?.id) {
        localStorage.removeItem('pendingInviteCode')
        router.push(`/family/${family.id}/tree`)
        return
      }
      setError(message)
    } finally {
      setJoining(false)
    }
  }, [code, family?.id, router])

  useEffect(() => {
    if (!loading && family && localStorage.getItem('pendingInviteCode') === code && localStorage.getItem('accessToken')) {
      join()
    }
  }, [code, family, join, loading])

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <p style={{ color: 'var(--ink3)' }}>Đang kiểm tra link mời...</p>
        </div>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--primary2)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          HT
        </div>
        {family ? (
          <>
            <div style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Lời mời tham gia</div>
            <h1 style={{ fontSize: 28, color: 'var(--ink)', marginBottom: 8 }}>{family.name}</h1>
            <p style={{ color: 'var(--ink3)', fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>
              {family.description || 'Bạn được mời tham gia không gian gia phả số của dòng họ này.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 18 }}>
              <Info label="Thành viên" value={`${family._count?.persons ?? 0} người`} />
              <Info label="Quê gốc" value={[family.originCommune, family.originDistrict, family.originProvince].filter(Boolean).join(', ') || 'Chưa cập nhật'} />
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={join} disabled={joining}>
                {joining ? 'Đang tham gia...' : 'Tham gia dòng họ'}
              </button>
              <button className="btn btn-outline" onClick={() => router.push('/login')}>
                Đăng nhập
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 8 }}>Link mời không khả dụng</h1>
            <p style={{ color: 'var(--ink3)', fontSize: 14, marginBottom: 14 }}>{error}</p>
            <button className="btn btn-outline" onClick={() => router.push('/dashboard')}>Về trang chủ</button>
          </>
        )}
      </section>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 700 }}>{value}</div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--bg)',
  display: 'grid',
  placeItems: 'center',
  padding: 20,
}

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 620,
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 24,
  boxShadow: '0 16px 40px rgba(28, 26, 23, 0.08)',
}

const errorStyle: React.CSSProperties = {
  background: 'var(--red2)',
  color: 'var(--red)',
  borderRadius: 12,
  padding: 12,
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 12,
}
