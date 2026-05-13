'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import { createPerson, getFamily, getFamilyTree } from '@/lib/api'

type Person = {
  id: string
  fullName: string
  gender: string
  birthDate: string | null
  generationNum: number | null
}

const relationOptions = [
  { value: 'PARENT', label: 'Cha/mẹ của người đã chọn' },
  { value: 'SPOUSE', label: 'Vợ/chồng của người đã chọn' },
  { value: 'SIBLING', label: 'Anh/chị/em của người đã chọn' },
  { value: 'ADOPTED_PARENT', label: 'Cha/mẹ nuôi của người đã chọn' },
  { value: 'HALF_SIBLING', label: 'Cùng cha/mẹ với người đã chọn' },
  { value: 'EX_SPOUSE', label: 'Vợ/chồng cũ của người đã chọn' },
]

function clean(data: Record<string, any>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== '' && value !== undefined && value !== null))
}

export default function AddPersonPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const familyId = params.id
  const [family, setFamily] = useState<any>(null)
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    nickname: '',
    gender: 'UNKNOWN',
    birthDate: '',
    deathDate: '',
    isAlive: true,
    hometown: '',
    currentLocation: '',
    occupation: '',
    bio: '',
    isRootAncestor: false,
    relatedPersonId: '',
    relationToRelated: 'PARENT',
  })

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }
    Promise.all([getFamily(familyId), getFamilyTree(familyId)])
      .then(([familyRes, treeRes]) => {
        setFamily(familyRes.data)
        setPersons(treeRes.data.persons)
      })
      .catch((e) => {
        if (e.response?.status === 401) router.push('/login')
        else setError(e.response?.data?.message || 'Không tải được dữ liệu dòng họ')
      })
      .finally(() => setLoading(false))
  }, [familyId, router])

  const sortedPersons = useMemo(
    () => [...persons].sort((a, b) => (a.generationNum ?? 99) - (b.generationNum ?? 99) || a.fullName.localeCompare(b.fullName)),
    [persons],
  )

  function setField(name: string, value: any) {
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
    setMessage('')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim()) {
      setError('Nhập họ tên thành viên')
      return
    }
    if (!form.isRootAncestor && form.relatedPersonId && !form.relationToRelated) {
      setError('Chọn mối quan hệ với thành viên đã chọn')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = clean({
        familyId,
        fullName: form.fullName.trim(),
        nickname: form.nickname.trim(),
        gender: form.gender,
        birthDate: form.birthDate,
        deathDate: form.isAlive ? '' : form.deathDate,
        isAlive: form.isAlive,
        hometown: form.hometown.trim(),
        currentLocation: form.currentLocation.trim(),
        occupation: form.occupation.trim(),
        bio: form.bio.trim(),
        isRootAncestor: form.isRootAncestor,
        relatedPersonId: form.isRootAncestor ? '' : form.relatedPersonId,
        relationToRelated: form.isRootAncestor || !form.relatedPersonId ? '' : form.relationToRelated,
      })
      const res = await createPerson(payload)
      if (res.data?.changeType) {
        setMessage('Đã gửi yêu cầu thêm thành viên. Quản trị viên sẽ duyệt trước khi hiển thị trên cây.')
      } else {
        router.push(`/family/${familyId}/tree`)
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể thêm thành viên')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <p style={{ color: 'var(--ink3)' }}>Đang tải form...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar familyId={familyId} />
      <div className="app-layout">
        <Sidebar familyId={familyId} familyName={family?.name ?? 'Dòng họ'} memberCount={persons.length} />
        <main className="main-content" style={{ overflow: 'auto' }}>
          <form onSubmit={onSubmit} style={{ maxWidth: 880, width: '100%', padding: 20, margin: '0 auto 80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Thêm thành viên</div>
                <h1 style={{ fontSize: 26, color: 'var(--ink)' }}>{family?.name ?? 'Dòng họ'}</h1>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => router.push(`/family/${familyId}/tree`)}>
                Quay lại cây
              </button>
            </div>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Thông tin cơ bản</h2>
              <div style={gridStyle}>
                <Field label="Họ tên *">
                  <input value={form.fullName} onChange={(e) => setField('fullName', e.target.value)} placeholder="Ví dụ: Nguyễn Văn An" />
                </Field>
                <Field label="Tên thường gọi">
                  <input value={form.nickname} onChange={(e) => setField('nickname', e.target.value)} placeholder="Tên gọi trong nhà" />
                </Field>
                <Field label="Giới tính">
                  <select value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
                    <option value="UNKNOWN">Chưa rõ</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </Field>
                <Field label="Trạng thái">
                  <select value={form.isAlive ? 'alive' : 'passed'} onChange={(e) => setField('isAlive', e.target.value === 'alive')}>
                    <option value="alive">Còn sống</option>
                    <option value="passed">Đã mất</option>
                  </select>
                </Field>
                <Field label="Ngày sinh">
                  <input type="date" value={form.birthDate} onChange={(e) => setField('birthDate', e.target.value)} />
                </Field>
                {!form.isAlive && (
                  <Field label="Ngày mất">
                    <input type="date" value={form.deathDate} onChange={(e) => setField('deathDate', e.target.value)} />
                  </Field>
                )}
              </div>
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Liên kết vào cây</h2>
              <label style={checkStyle}>
                <input type="checkbox" checked={form.isRootAncestor} onChange={(e) => setField('isRootAncestor', e.target.checked)} />
                Đánh dấu là thủy tổ / người gốc của dòng họ
              </label>
              {!form.isRootAncestor && (
                <div style={gridStyle}>
                  <Field label="Thành viên liên quan">
                    <select value={form.relatedPersonId} onChange={(e) => setField('relatedPersonId', e.target.value)}>
                      <option value="">Chưa gắn quan hệ</option>
                      {sortedPersons.map((p) => (
                        <option key={p.id} value={p.id}>
                          Đời {p.generationNum ?? '?'} - {p.fullName}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Quan hệ của người mới">
                    <select value={form.relationToRelated} onChange={(e) => setField('relationToRelated', e.target.value)} disabled={!form.relatedPersonId}>
                      {relationOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Thông tin bổ sung</h2>
              <div style={gridStyle}>
                <Field label="Quê quán">
                  <input value={form.hometown} onChange={(e) => setField('hometown', e.target.value)} placeholder="Tỉnh / huyện / xã" />
                </Field>
                <Field label="Nơi ở hiện tại">
                  <input value={form.currentLocation} onChange={(e) => setField('currentLocation', e.target.value)} placeholder="Địa phương hiện tại" />
                </Field>
                <Field label="Nghề nghiệp">
                  <input value={form.occupation} onChange={(e) => setField('occupation', e.target.value)} placeholder="Nghề nghiệp, vai trò" />
                </Field>
              </div>
              <Field label="Ghi chú / tiểu sử">
                <textarea value={form.bio} onChange={(e) => setField('bio', e.target.value)} rows={5} placeholder="Câu chuyện, công đức, thông tin cần lưu lại" />
              </Field>
            </section>

            {error && <div style={alertStyle('error')}>{error}</div>}
            {message && <div style={alertStyle('ok')}>{message}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => router.push(`/family/${familyId}/tree`)}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu thành viên'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{ display: 'block', fontSize: 12, color: 'var(--ink3)', fontWeight: 700, marginBottom: 7 }}>{label}</span>
      {children}
    </label>
  )
}

const sectionStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 18,
  marginBottom: 14,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 18,
  marginBottom: 14,
  color: 'var(--ink)',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 12,
}

const checkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: 'var(--ink2)',
  fontSize: 14,
  marginBottom: 14,
}

function alertStyle(kind: 'error' | 'ok'): React.CSSProperties {
  return {
    background: kind === 'error' ? 'var(--red2)' : 'var(--primary2)',
    color: kind === 'error' ? 'var(--red)' : 'var(--primary)',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontWeight: 600,
  }
}
