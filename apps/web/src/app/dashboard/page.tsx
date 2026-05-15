'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createFamily, createPerson, getFamilyActivity, getMyFamilies, joinFamilyByCode } from '@/lib/api'
import { useToast } from '@/components/Toast'

export default function DashboardPage() {
  const router = useRouter()
  const toast = useToast()
  const [families, setFamilies] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }
    getMyFamilies()
      .then((res) => {
        setFamilies(res.data)
        const done = localStorage.getItem('hotoc:onboardingDone') === '1'
        setShowOnboarding(!done)
        const firstFamilyId = res.data?.[0]?.id
        if (firstFamilyId) getFamilyActivity(firstFamilyId).then((activityRes) => setActivity(activityRes.data)).catch(() => setActivity([]))
      })
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
            <SectionHeader title="Hoạt động gần đây" />
            <div style={sideCardStyle}>
              {activity.length === 0 ? (
                <div style={{ padding: '16px 0', color: 'var(--ink3)', fontSize: 13 }}>Chưa có hoạt động mới trong 30 ngày qua.</div>
              ) : activity.map((item) => (
                <Action
                  key={item.id}
                  href={item.entityType === 'Person' ? `/family/${families[0]?.id}/tree?person=${item.entityId}` : `/family/${families[0]?.id}/about`}
                  title={activityTitle(item)}
                  desc={relativeTime(item.createdAt)}
                />
              ))}
            </div>
          </aside>
        </div>
      </section>
      {showOnboarding && (
        <OnboardingWizard
          onDone={() => {
            localStorage.setItem('hotoc:onboardingDone', '1')
            setShowOnboarding(false)
          }}
          onFamilyReady={(familyId) => router.push(`/family/${familyId}/tree`)}
          toast={toast}
        />
      )}
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
    <div className="empty-state">
      <div className="empty-state-icon">+</div>
      <h2 style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>Bắt đầu bằng cách tạo dòng họ</h2>
      <p style={{ color: 'var(--ink3)', fontSize: 14, marginBottom: 18 }}>Tạo dòng họ đầu tiên hoặc tham gia bằng mã mời để xem cây gia phả.</p>
      <Link href="/family/create" className="btn btn-primary" style={{ textDecoration: 'none' }}>Tạo dòng họ</Link>
    </div>
  )
}

function OnboardingWizard({ onDone, onFamilyReady, toast }: {
  onDone: () => void
  onFamilyReady: (familyId: string) => void
  toast: (message: string, kind?: 'success' | 'warning' | 'error') => void
}) {
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [fullName, setFullName] = useState('')

  async function createOrJoin(kind: 'create' | 'join') {
    setBusy(true)
    try {
      const res = kind === 'create'
        ? await createFamily({ name: familyName || 'Dòng họ của tôi' })
        : await joinFamilyByCode(inviteCode.trim())
      const id = res.data.id ?? res.data.familyId
      setFamilyId(id)
      toast(kind === 'create' ? 'Đã tạo dòng họ' : 'Đã tham gia dòng họ')
      setStep(2)
    } catch {
      toast('Có lỗi xảy ra, thử lại', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function addSelf() {
    if (!familyId || !fullName.trim()) {
      onDone()
      if (familyId) onFamilyReady(familyId)
      return
    }
    setBusy(true)
    try {
      await createPerson({ familyId, fullName: fullName.trim(), isRootAncestor: true, gender: 'UNKNOWN' })
      toast(`Đã thêm ${fullName.trim()} vào cây`)
      onDone()
      onFamilyReady(familyId)
    } catch {
      toast('Có lỗi xảy ra, thử lại', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(28,26,23,.55)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div style={{ width: 'min(560px, 100%)', background: 'var(--card)', borderRadius: 16, padding: 20, boxShadow: '0 20px 70px rgba(0,0,0,.25)' }}>
        <div style={{ color: 'var(--ink3)', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Bước {step + 1}/3</div>
        {step === 0 && (
          <>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Chào mừng đến Họ Tộc</h2>
            <p style={{ color: 'var(--ink3)', marginBottom: 18 }}>Ứng dụng giúp gia đình tạo cây gia phả, mời con cháu tham gia, lưu câu chuyện và nhắc ngày giỗ.</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <button className="btn btn-outline" onClick={onDone}>Skip</button>
              <button className="btn btn-primary" onClick={() => setStep(1)}>Tiếp tục</button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>Tạo dòng họ hoặc nhập mã mời</h2>
            <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
              <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Tên dòng họ, ví dụ: Họ Nguyễn - Hà Tĩnh" />
              <button className="btn btn-primary" disabled={busy} onClick={() => createOrJoin('create')}>{busy ? 'Đang xử lý...' : 'Tạo dòng họ'}</button>
              <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Hoặc nhập invite code" />
              <button className="btn btn-outline" disabled={busy || !inviteCode.trim()} onClick={() => createOrJoin('join')}>Tham gia bằng code</button>
            </div>
            <button className="btn btn-outline" onClick={onDone}>Skip</button>
          </>
        )}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>Thêm thành viên đầu tiên</h2>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Họ tên của bạn" style={{ marginBottom: 14 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <button className="btn btn-outline" onClick={addSelf}>Skip</button>
              <button className="btn btn-primary" disabled={busy} onClick={addSelf}>{busy ? 'Đang xử lý...' : 'Hoàn thành'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function activityTitle(item: any) {
  const actor = item.performedBy?.displayName || item.performedBy?.phone || 'Một thành viên'
  const name = item.newValue?.fullName || item.newValue?.name || 'dữ liệu'
  if (item.entityType === 'FamilyMember') return `${actor} đã tham gia dòng họ`
  if (item.action === 'CREATE') return `${actor} đã thêm ${name}`
  return `${actor} đã cập nhật ${name}`
}

function relativeTime(input: string) {
  const diff = Date.now() - new Date(input).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Vừa xong'
  if (hours < 24) return `${hours} giờ trước`
  if (hours < 48) return 'Hôm qua'
  return new Date(input).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })
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
