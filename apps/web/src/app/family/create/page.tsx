'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createFamily } from '@/lib/api'
import { useToast } from '@/components/Toast'

export default function CreateFamilyPage() {
  const router = useRouter()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    originProvince: '',
    originDistrict: '',
    originCommune: '',
    description: '',
    visibility: 'PRIVATE',
  })

  function setField(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Nhập tên dòng họ')
      return
    }
    setSaving(true)
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''))
      const res = await createFamily(payload)
      toast('Đã lưu')
      router.push(`/family/${res.data.id}/tree`)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể tạo dòng họ')
      toast('Có lỗi xảy ra, thử lại', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', padding: 20 }}>
      <form onSubmit={onSubmit} style={{ maxWidth: 760, margin: '0 auto', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Dòng họ mới</div>
          <h1 style={{ fontSize: 26 }}>Tạo dòng họ</h1>
        </div>
        <Field label="Tên dòng họ *">
          <input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Ví dụ: Họ Nguyễn - Hà Tĩnh" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Field label="Tỉnh">
            <input value={form.originProvince} onChange={(e) => setField('originProvince', e.target.value)} />
          </Field>
          <Field label="Huyện">
            <input value={form.originDistrict} onChange={(e) => setField('originDistrict', e.target.value)} />
          </Field>
          <Field label="Xã">
            <input value={form.originCommune} onChange={(e) => setField('originCommune', e.target.value)} />
          </Field>
        </div>
        <Field label="Mô tả">
          <textarea rows={5} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Nguồn gốc, nhà thờ họ, vùng sinh sống chính..." />
        </Field>
        {error && <div style={{ background: 'var(--red2)', color: 'var(--red)', borderRadius: 12, padding: 12, fontWeight: 600, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-outline" onClick={() => router.push('/dashboard')}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo dòng họ'}</button>
        </div>
      </form>
    </main>
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
