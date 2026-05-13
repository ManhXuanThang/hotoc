'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import { getFamily, getFamilyTree, getReminders, syncReminders } from '@/lib/api'

export default function RemindersPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const familyId = params.id
  const [family, setFamily] = useState<any>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
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
      const [familyRes, treeRes, remindersRes] = await Promise.all([
        getFamily(familyId),
        getFamilyTree(familyId),
        getReminders(familyId, 120),
      ])
      setFamily(familyRes.data)
      setMemberCount(treeRes.data.totalPersons ?? treeRes.data.persons?.length ?? 0)
      setReminders(remindersRes.data)
    } catch (e: any) {
      if (e.response?.status === 401) router.push('/login')
      else setError(e.response?.data?.message || 'Không tải được nhắc giỗ')
    } finally {
      setLoading(false)
    }
  }

  async function sync() {
    setSyncing(true)
    setError('')
    try {
      const res = await syncReminders(familyId)
      setReminders(res.data)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể đồng bộ nhắc giỗ')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar familyId={familyId} />
      <div className="app-layout">
        <Sidebar familyId={familyId} familyName={family?.name ?? 'Dòng họ'} memberCount={memberCount} />
        <main className="main-content" style={{ overflow: 'auto' }}>
          <div style={{ maxWidth: 900, width: '100%', padding: 20, margin: '0 auto 80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Nhắc giỗ</div>
                <h1 style={{ fontSize: 26 }}>Ngày giỗ sắp tới</h1>
              </div>
              <button className="btn btn-primary" onClick={sync} disabled={syncing}>{syncing ? 'Đang đồng bộ...' : 'Đồng bộ từ cây'}</button>
            </div>

            {error && <div style={errorStyle}>{error}</div>}
            {loading ? (
              <div style={cardStyle}>Đang tải...</div>
            ) : reminders.length === 0 ? (
              <div style={cardStyle}>
                <h2 style={{ fontSize: 18, marginBottom: 6 }}>Chưa có lịch nhắc</h2>
                <p style={{ color: 'var(--ink3)', fontSize: 14 }}>Bấm đồng bộ để tạo nhắc giỗ từ các thành viên đã có ngày mất.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {reminders.map((reminder) => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function ReminderCard({ reminder }: { reminder: any }) {
  const date = new Date(reminder.reminderDate)
  return (
    <section style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 58, borderRadius: 12, background: 'var(--primary2)', color: 'var(--primary)', padding: 9, textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontFamily: 'Lora, serif', lineHeight: 1 }}>{date.getDate()}</div>
          <div style={{ fontSize: 11, fontWeight: 700 }}>Th {date.getMonth() + 1}</div>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 17, marginBottom: 4 }}>{reminder.person?.fullName ?? 'Thành viên'}</h2>
          <div style={{ color: 'var(--ink3)', fontSize: 13 }}>
            {reminder.type === 'DEATH_ANNIVERSARY' ? 'Ngày giỗ' : 'Sinh nhật'} · {date.toLocaleDateString('vi-VN')}
          </div>
        </div>
        <span style={{ background: reminder.isSent ? 'var(--primary2)' : 'var(--gold2)', color: reminder.isSent ? 'var(--primary)' : '#92400E', borderRadius: 10, padding: '6px 9px', fontSize: 12, fontWeight: 700 }}>
          {reminder.isSent ? 'Đã gửi' : 'Chưa gửi'}
        </span>
      </div>
    </section>
  )
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
