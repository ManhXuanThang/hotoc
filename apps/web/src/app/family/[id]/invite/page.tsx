'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import { getFamily, getFamilyTree, regenerateInvite } from '@/lib/api'

type InviteState = {
  inviteCode?: string | null
  inviteExpiresAt?: string | null
}

export default function InvitePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const familyId = params.id
  const [family, setFamily] = useState<any>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [invite, setInvite] = useState<InviteState>({})
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }
    Promise.all([getFamily(familyId), getFamilyTree(familyId)])
      .then(([familyRes, treeRes]) => {
        setFamily(familyRes.data)
        setMemberCount(treeRes.data.totalPersons ?? treeRes.data.persons?.length ?? 0)
        setInvite({
          inviteCode: familyRes.data.inviteCode,
          inviteExpiresAt: familyRes.data.inviteExpiresAt,
        })
      })
      .catch((e) => {
        if (e.response?.status === 401) router.push('/login')
        else setError(e.response?.data?.message || 'Không tải được link mời')
      })
      .finally(() => setLoading(false))
  }, [familyId, router])

  const inviteUrl = useMemo(() => {
    if (!invite.inviteCode || typeof window === 'undefined') return ''
    return `${window.location.origin}/join/${invite.inviteCode}`
  }, [invite.inviteCode])

  async function regenerate() {
    setSaving(true)
    setError('')
    setCopied(false)
    try {
      const res = await regenerateInvite(familyId, days)
      setInvite(res.data)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể tạo link mời')
    } finally {
      setSaving(false)
    }
  }

  async function copyLink() {
    if (!inviteUrl) return
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(inviteUrl)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <p style={{ color: 'var(--ink3)' }}>Đang tải link mời...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar familyId={familyId} />
      <div className="app-layout">
        <Sidebar familyId={familyId} familyName={family?.name ?? 'Dòng họ'} memberCount={memberCount} />
        <main className="main-content" style={{ overflow: 'auto' }}>
          <div style={{ maxWidth: 860, width: '100%', padding: 20, margin: '0 auto 80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Link mời</div>
                <h1 style={{ fontSize: 26, color: 'var(--ink)' }}>{family?.name ?? 'Dòng họ'}</h1>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => router.push(`/family/${familyId}/tree`)}>
                Mở cây gia phả
              </button>
            </div>

            <section style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: 20, marginBottom: 8 }}>Mời thành viên tham gia dòng họ</h2>
                  <p style={{ color: 'var(--ink3)', fontSize: 14, maxWidth: 560 }}>
                    Gửi link này cho người thân. Sau khi đăng nhập bằng số điện thoại, họ có thể tham gia với vai trò xem và bổ sung thông tin theo quyền được cấp.
                  </p>
                </div>
                <span style={statusStyle(invite.inviteCode ? 'ok' : 'warn')}>
                  {invite.inviteCode ? 'Đang hoạt động' : 'Chưa có code'}
                </span>
              </div>

              <div style={{ marginTop: 18 }}>
                <label style={labelStyle}>Đường dẫn mời</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input value={inviteUrl || 'Chưa có link mời'} readOnly style={{ flex: '1 1 320px' }} />
                  <button className="btn btn-primary" onClick={copyLink} disabled={!inviteUrl}>
                    {copied ? 'Đã copy' : 'Copy link'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
                <Info label="Mã mời" value={invite.inviteCode ?? 'Chưa có'} />
                <Info label="Hết hạn" value={formatDate(invite.inviteExpiresAt)} />
                <Info label="Thành viên trong cây" value={`${memberCount} người`} />
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ fontSize: 18, marginBottom: 12 }}>Tạo lại link mời</h2>
              <p style={{ color: 'var(--ink3)', fontSize: 14, marginBottom: 14 }}>
                Tạo code mới sẽ làm link cũ không còn dùng được.
              </p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ minWidth: 220 }}>
                  <span style={labelStyle}>Thời hạn</span>
                  <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                    <option value={7}>7 ngày</option>
                    <option value={30}>30 ngày</option>
                    <option value={90}>90 ngày</option>
                    <option value={0}>Không hết hạn</option>
                  </select>
                </label>
                <button className="btn btn-outline" onClick={regenerate} disabled={saving} style={{ marginTop: 22 }}>
                  {saving ? 'Đang tạo...' : 'Tạo link mời'}
                </button>
              </div>
              {error && <div style={{ ...alertStyle, marginTop: 14 }}>{error}</div>}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 700 }}>{value}</div>
    </div>
  )
}

function formatDate(value?: string | null) {
  if (!value) return 'Không hết hạn'
  return new Date(value).toLocaleDateString('vi-VN')
}

const cardStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 18,
  marginBottom: 14,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'var(--ink3)',
  fontWeight: 700,
  marginBottom: 7,
}

const alertStyle: React.CSSProperties = {
  background: 'var(--red2)',
  color: 'var(--red)',
  borderRadius: 12,
  padding: 12,
  fontSize: 14,
  fontWeight: 600,
}

function statusStyle(kind: 'ok' | 'warn'): React.CSSProperties {
  return {
    background: kind === 'ok' ? 'var(--primary2)' : 'var(--gold2)',
    color: kind === 'ok' ? 'var(--primary)' : '#92400E',
    borderRadius: 10,
    padding: '7px 10px',
    fontSize: 12,
    fontWeight: 700,
  }
}
