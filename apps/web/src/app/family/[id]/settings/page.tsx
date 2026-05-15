'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import { exportFamily, getFamily, getFamilyTree } from '@/lib/api'
import { useToast } from '@/components/Toast'

export default function SettingsPage() {
  const router = useRouter()
  const toast = useToast()
  const params = useParams<{ id: string }>()
  const familyId = params.id
  const [family, setFamily] = useState<any>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [prefs, setPrefs] = useState({ death7: true, death1: true, joins: true, zaloFallback: false })

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login')
      return
    }
    const stored = localStorage.getItem(`hotoc:notifications:${familyId}`)
    if (stored) setPrefs(JSON.parse(stored))
    Promise.all([getFamily(familyId), getFamilyTree(familyId)])
      .then(([familyRes, treeRes]) => {
        setFamily(familyRes.data)
        setMemberCount(treeRes.data.totalPersons ?? 0)
      })
      .finally(() => setLoading(false))
  }, [familyId, router])

  function save() {
    localStorage.setItem(`hotoc:notifications:${familyId}`, JSON.stringify(prefs))
    toast('Đã lưu')
  }

  async function download(format: 'json' | 'csv') {
    try {
      const res = await exportFamily(familyId, format)
      const content = format === 'csv' ? res.data.content : JSON.stringify(res.data, null, 2)
      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${family?.name ?? 'hotoc'}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast('Đã lưu')
    } catch {
      toast('Có lỗi xảy ra, thử lại', 'error')
    }
  }

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Đang tải cài đặt...</main>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar familyId={familyId} />
      <div className="app-layout">
        <Sidebar familyId={familyId} familyName={family?.name ?? 'Dòng họ'} memberCount={memberCount} />
        <main className="main-content" style={{ overflow: 'auto' }}>
          <div style={{ maxWidth: 840, width: '100%', padding: 20, margin: '0 auto 80px' }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Cài đặt</div>
              <h1 style={{ fontSize: 26 }}>Cài đặt dòng họ</h1>
            </div>

            <section style={cardStyle}>
              <h2 style={titleStyle}>Thông báo</h2>
              <Toggle label="Nhắc giỗ trước 7 ngày" checked={prefs.death7} onChange={(value) => setPrefs({ ...prefs, death7: value })} />
              <Toggle label="Nhắc giỗ trước 1 ngày" checked={prefs.death1} onChange={(value) => setPrefs({ ...prefs, death1: value })} />
              <Toggle label="Có thành viên mới tham gia" checked={prefs.joins} onChange={(value) => setPrefs({ ...prefs, joins: value })} />
              <Toggle label="Dùng Zalo OA nếu chưa có FCM token" checked={prefs.zaloFallback} onChange={(value) => setPrefs({ ...prefs, zaloFallback: value })} />
              <p style={{ color: 'var(--ink3)', fontSize: 13, marginTop: 10 }}>FCM/Zalo thật cần Firebase project và Zalo OA credentials trước khi gửi production.</p>
              <button className="btn btn-primary" onClick={save} style={{ marginTop: 12 }}>Lưu cài đặt</button>
            </section>

            <section style={{ ...cardStyle, marginTop: 14 }}>
              <h2 style={titleStyle}>Export dữ liệu</h2>
              <p style={{ color: 'var(--ink3)', marginBottom: 12 }}>File mặc định không chứa SĐT và địa chỉ.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" onClick={() => download('json')}>Tải JSON</button>
                <button className="btn btn-outline" onClick={() => download('csv')}>Tải CSV</button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18 }} />
    </label>
  )
}

const cardStyle: React.CSSProperties = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }
const titleStyle: React.CSSProperties = { fontSize: 20, marginBottom: 12 }
