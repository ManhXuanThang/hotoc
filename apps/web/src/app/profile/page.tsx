'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getMe, logoutApi, updateMe, updatePerson } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { useToast } from '@/components/Toast'

export default function ProfilePage() {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const toast = useToast()
  const [me, setMe] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)
  const [savingPerson, setSavingPerson] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [personForm, setPersonForm] = useState({
    fullName: '',
    birthDate: '',
    currentLocation: '',
    occupation: '',
    bio: '',
  })

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login')
      return
    }
    getMe()
      .then((res) => {
        setMe(res.data)
        setDisplayName(res.data?.displayName ?? '')
        const person = res.data?.claims?.[0]?.person
        if (person) {
          setPersonForm({
            fullName: person.fullName ?? '',
            birthDate: person.birthDate ? person.birthDate.slice(0, 10) : '',
            currentLocation: person.currentLocation ?? '',
            occupation: person.occupation ?? '',
            bio: person.bio ?? '',
          })
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  const primaryFamily = me?.familyMembers?.[0]
  const claimedPerson = me?.claims?.[0]?.person
  const roleLabel = useMemo(() => roleName(primaryFamily?.role), [primaryFamily])

  async function saveDisplayName(e: FormEvent) {
    e.preventDefault()
    setSavingName(true)
    try {
      const res = await updateMe({ displayName })
      localStorage.setItem('displayName', res.data.displayName || '')
      setMe((current: any) => ({ ...current, displayName: res.data.displayName }))
      toast('Đã lưu tên hiển thị')
    } catch {
      toast('Có lỗi xảy ra, thử lại', 'error')
    } finally {
      setSavingName(false)
    }
  }

  async function savePerson(e: FormEvent) {
    e.preventDefault()
    if (!claimedPerson?.id) {
      toast('Bạn chưa gắn hồ sơ trong cây', 'warning')
      return
    }
    setSavingPerson(true)
    try {
      const res = await updatePerson(claimedPerson.id, personForm)
      if (res.data?.status === 'PENDING' || res.data?.changeType) {
        toast('Chờ duyệt', 'warning')
      } else {
        toast('Đã lưu hồ sơ cá nhân')
      }
    } catch {
      toast('Có lỗi xảy ra, thử lại', 'error')
    } finally {
      setSavingPerson(false)
    }
  }

  async function signOut() {
    try { await logoutApi() } catch {}
    logout()
    router.push('/login')
  }

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Đang tải hồ sơ...</main>

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', padding: 20 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ color: 'var(--ink3)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Tài khoản</div>
            <h1 style={{ fontSize: 28 }}>Hồ sơ của tôi</h1>
          </div>
          <Link href="/dashboard" className="btn btn-outline" style={{ textDecoration: 'none' }}>Dashboard</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <section style={cardStyle}>
            <h2 style={titleStyle}>Thông tin tài khoản</h2>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
              <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 20 }}>
                {(displayName || me?.phone || 'U').slice(-1).toUpperCase()}
              </div>
              <div>
                <div style={{ color: 'var(--ink3)', fontSize: 12 }}>Số điện thoại</div>
                <div style={{ fontWeight: 700 }}>{me?.phone}</div>
                <div style={privacyStyle}>Ai thấy được? Chỉ Admin</div>
              </div>
            </div>
            <form onSubmit={saveDisplayName}>
              <label style={labelStyle}>Tên hiển thị</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tên hiển thị" />
              <button className="btn btn-primary" disabled={savingName} style={{ marginTop: 12 }}>{savingName ? 'Đang xử lý...' : 'Lưu tên hiển thị'}</button>
            </form>
          </section>

          <section style={cardStyle}>
            <h2 style={titleStyle}>Dòng họ đang tham gia</h2>
            {primaryFamily ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{primaryFamily.family.name}</div>
                <div style={{ color: 'var(--ink3)', marginBottom: 12 }}>
                  Vai trò: {roleLabel} · {primaryFamily.family._count?.persons ?? 0} thành viên
                  {claimedPerson?.generationNum ? ` · Đời ${claimedPerson.generationNum}` : ''}
                </div>
                <Link href={`/family/${primaryFamily.family.id}/tree`} className="btn btn-primary" style={{ textDecoration: 'none' }}>Mở cây gia phả</Link>
              </>
            ) : (
              <div className="empty-state" style={{ padding: 18 }}>
                <div className="empty-state-icon">+</div>
                <p style={{ color: 'var(--ink3)', marginBottom: 12 }}>Bạn chưa tham gia dòng họ nào.</p>
                <Link href="/family/create" className="btn btn-primary" style={{ textDecoration: 'none' }}>Tạo dòng họ</Link>
              </div>
            )}
          </section>
        </div>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <h2 style={titleStyle}>Thông tin cá nhân trong cây</h2>
          {claimedPerson ? (
            <form onSubmit={savePerson}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <Field label="Họ tên" hint="Tất cả thành viên">
                  <input value={personForm.fullName} onChange={(e) => setPersonForm({ ...personForm, fullName: e.target.value })} />
                </Field>
                <Field label="Ngày sinh" hint="Tất cả thành viên">
                  <input type="date" value={personForm.birthDate} onChange={(e) => setPersonForm({ ...personForm, birthDate: e.target.value })} />
                </Field>
                <Field label="Nơi ở hiện tại" hint="Member+">
                  <input value={personForm.currentLocation} onChange={(e) => setPersonForm({ ...personForm, currentLocation: e.target.value })} />
                </Field>
                <Field label="Nghề nghiệp" hint="Tất cả thành viên">
                  <input value={personForm.occupation} onChange={(e) => setPersonForm({ ...personForm, occupation: e.target.value })} />
                </Field>
              </div>
              <Field label="Câu chuyện cuộc đời" hint="Tất cả thành viên">
                <textarea rows={7} value={personForm.bio} onChange={(e) => setPersonForm({ ...personForm, bio: e.target.value })} placeholder="Kể về cuộc đời, sự nghiệp, những kỷ niệm đáng nhớ..." style={{ fontSize: 15, lineHeight: 1.7 }} />
              </Field>
              <button className="btn btn-primary" disabled={savingPerson}>{savingPerson ? 'Đang xử lý...' : 'Lưu thông tin trong cây'}</button>
            </form>
          ) : (
            <div className="empty-state" style={{ padding: 18 }}>
              <div className="empty-state-icon">i</div>
              <h3 style={{ marginBottom: 6 }}>Chưa gắn với thành viên trong cây</h3>
              <p style={{ color: 'var(--ink3)' }}>Admin cần duyệt claim hồ sơ trước khi bạn sửa thông tin cá nhân trực tiếp.</p>
            </div>
          )}
        </section>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <h2 style={titleStyle}>Quyền riêng tư</h2>
          <p style={{ color: 'var(--ink3)', marginBottom: 12 }}>Thông tin nhạy cảm như SĐT và địa chỉ chỉ hiển thị cho Member+ hoặc Admin. Bạn có thể yêu cầu ẩn SĐT khỏi tất cả trong giai đoạn kiểm duyệt.</p>
          <button className="btn btn-outline" onClick={() => toast('Đã ghi nhận yêu cầu ẩn SĐT', 'warning')}>Yêu cầu ẩn SĐT</button>
        </section>

        <button className="btn btn-outline" onClick={signOut} style={{ marginTop: 14, color: 'var(--red)' }}>Đăng xuất</button>
      </div>
    </main>
  )
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={labelStyle}>{label}</span>
      {children}
      <span style={privacyStyle}>Ai thấy được? {hint}</span>
    </label>
  )
}

function roleName(role?: string) {
  if (role === 'SUPER_ADMIN') return 'Trưởng họ'
  if (role === 'BRANCH_ADMIN') return 'Quản trị nhánh'
  if (role === 'VIEWER') return 'Khách xem'
  return 'Thành viên'
}

const cardStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 18,
}

const titleStyle: React.CSSProperties = { fontSize: 20, marginBottom: 14 }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: 'var(--ink3)', fontWeight: 700, marginBottom: 7 }
const privacyStyle: React.CSSProperties = { display: 'block', color: 'var(--ink4)', fontSize: 11, marginTop: 5 }
