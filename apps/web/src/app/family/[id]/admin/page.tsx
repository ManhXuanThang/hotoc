'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import { getChangeRequests, getFamily, getFamilyTree, reviewChangeRequest } from '@/lib/api'
import { useToast } from '@/components/Toast'

export default function AdminPage() {
  const router = useRouter()
  const toast = useToast()
  const params = useParams<{ id: string }>()
  const familyId = params.id
  const [family, setFamily] = useState<any>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }
    load()
  }, [familyId, router])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [familyRes, treeRes, requestsRes] = await Promise.all([
        getFamily(familyId),
        getFamilyTree(familyId),
        getChangeRequests(familyId),
      ])
      setFamily(familyRes.data)
      setMemberCount(treeRes.data.totalPersons ?? treeRes.data.persons?.length ?? 0)
      setRequests(requestsRes.data)
    } catch (e: any) {
      if (e.response?.status === 401) router.push('/login')
      else setError(e.response?.data?.message || 'Không tải được danh sách duyệt')
    } finally {
      setLoading(false)
    }
  }

  async function review(id: string, action: 'APPROVE' | 'REJECT') {
    setBusyId(id)
    setError('')
    try {
      await reviewChangeRequest(id, action)
      setRequests((current) => current.filter((item) => item.id !== id))
      toast(action === 'APPROVE' ? 'Đã duyệt' : 'Đã từ chối', action === 'APPROVE' ? 'success' : 'error')
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể xử lý yêu cầu')
      toast('Có lỗi xảy ra, thử lại', 'error')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar familyId={familyId} />
      <div className="app-layout">
        <Sidebar familyId={familyId} familyName={family?.name ?? 'Dòng họ'} memberCount={memberCount} />
        <main className="main-content" style={{ overflow: 'auto' }}>
          <div style={{ maxWidth: 980, width: '100%', padding: 20, margin: '0 auto 80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Quản lý</div>
                <h1 style={{ fontSize: 26 }}>Duyệt thay đổi</h1>
              </div>
              <button className="btn btn-outline" onClick={load}>Tải lại</button>
            </div>

            {error && <div style={errorStyle}>{error}</div>}
            {loading ? (
              <div style={cardStyle}>Đang tải yêu cầu...</div>
            ) : requests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✓</div>
                <h2 style={{ fontSize: 18, marginBottom: 6 }}>Không có yêu cầu nào đang chờ duyệt</h2>
                <p style={{ color: 'var(--ink3)', fontSize: 14 }}>Các đề xuất thêm hoặc sửa thành viên sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {requests.map((request) => (
                  <RequestCard key={request.id} request={request} busy={busyId === request.id} onReview={review} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function RequestCard({ request, busy, onReview }: { request: any; busy: boolean; onReview: (id: string, action: 'APPROVE' | 'REJECT') => void }) {
  const changes = request.fieldChanges ?? {}
  return (
    <section style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
            {request.changeType === 'ADD_PERSON' ? 'Thêm thành viên' : 'Cập nhật hồ sơ'}
          </div>
          <h2 style={{ fontSize: 19, marginBottom: 4 }}>{changes.fullName || request.person?.fullName || 'Thành viên'}</h2>
          <p style={{ color: 'var(--ink3)', fontSize: 13 }}>
            Đề xuất bởi {request.requestedBy?.displayName || request.requestedBy?.phone || 'Thành viên'} · {new Date(request.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <span style={{ background: 'var(--gold2)', color: '#92400E', borderRadius: 10, padding: '7px 10px', fontSize: 12, fontWeight: 700, height: 30 }}>Chờ duyệt</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 14 }}>
        {Object.entries(changes)
          .filter(([key]) => !['familyId', 'relatedPersonId', 'relationToRelated'].includes(key))
          .map(([key, value]) => (
            <div key={key} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
              <div style={{ color: 'var(--ink3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{fieldLabel(key)}</div>
              <div style={{ color: 'var(--ink)', fontSize: 14, fontWeight: 600 }}>{formatValue(value)}</div>
            </div>
          ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-outline" onClick={() => onReview(request.id, 'REJECT')} disabled={busy}>Từ chối</button>
        <button className="btn btn-primary" onClick={() => onReview(request.id, 'APPROVE')} disabled={busy}>
          {busy ? 'Đang xử lý...' : 'Duyệt'}
        </button>
      </div>
    </section>
  )
}

function fieldLabel(key: string) {
  const labels: Record<string, string> = {
    fullName: 'Họ tên',
    nickname: 'Tên thường gọi',
    gender: 'Giới tính',
    birthDate: 'Ngày sinh',
    deathDate: 'Ngày mất',
    isAlive: 'Trạng thái',
    hometown: 'Quê quán',
    currentLocation: 'Nơi ở',
    occupation: 'Nghề nghiệp',
    bio: 'Tiểu sử',
    isRootAncestor: 'Thủy tổ',
  }
  return labels[key] ?? key
}

function formatValue(value: any) {
  if (typeof value === 'boolean') return value ? 'Có' : 'Không'
  if (!value) return 'Không có'
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return new Date(value).toLocaleDateString('vi-VN')
  if (value === 'MALE') return 'Nam'
  if (value === 'FEMALE') return 'Nữ'
  if (value === 'UNKNOWN') return 'Chưa rõ'
  return String(value)
}

const cardStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 16,
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
