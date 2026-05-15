'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import { getFamily, getFamilyTree } from '@/lib/api'

type Person = {
  id: string
  fullName: string
  gender: string
  birthDate: string | null
  deathDate: string | null
  isAlive: boolean
  currentLocation: string | null
  generationNum: number | null
  isRootAncestor: boolean
}

export default function MembersPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const familyId = params.id
  const [family, setFamily] = useState<any>(null)
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [generation, setGeneration] = useState('all')

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login')
      return
    }
    Promise.all([getFamily(familyId), getFamilyTree(familyId)])
      .then(([familyRes, treeRes]) => {
        setFamily(familyRes.data)
        setPersons(treeRes.data.persons ?? [])
      })
      .catch((e) => {
        if (e.response?.status === 401) router.push('/login')
      })
      .finally(() => setLoading(false))
  }, [familyId, router])

  const generations = useMemo(
    () => Array.from(new Set(persons.map((p) => p.generationNum).filter((value): value is number => typeof value === 'number'))).sort((a, b) => a - b),
    [persons],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return persons
      .filter((p) => generation === 'all' || String(p.generationNum ?? '') === generation)
      .filter((p) => !q || p.fullName.toLowerCase().includes(q) || (p.currentLocation ?? '').toLowerCase().includes(q))
      .sort((a, b) => (a.generationNum ?? 99) - (b.generationNum ?? 99) || a.fullName.localeCompare(b.fullName))
  }, [persons, generation, search])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Topbar familyId={familyId} />
        <div style={{ maxWidth: 980, margin: '0 auto', padding: 20, display: 'grid', gap: 10 }}>
          <div className="loading-skeleton" style={{ height: 42 }} />
          <div className="loading-skeleton" style={{ height: 86 }} />
          <div className="loading-skeleton" style={{ height: 86 }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar familyId={familyId} />
      <div className="app-layout">
        <Sidebar familyId={familyId} familyName={family?.name ?? 'Dòng họ'} memberCount={persons.length} />
        <main className="main-content" style={{ overflow: 'auto' }}>
          <div style={{ maxWidth: 980, width: '100%', padding: 20, margin: '0 auto 80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Thành viên</div>
                <h1 style={{ fontSize: 26 }}>{family?.name ?? 'Dòng họ'}</h1>
              </div>
              <Link href={`/family/${familyId}/add`} className="btn btn-primary" style={{ textDecoration: 'none' }}>Thêm thành viên</Link>
            </div>

            <section style={toolbarStyle}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc nơi ở..." />
              <select value={generation} onChange={(e) => setGeneration(e.target.value)}>
                <option value="all">Tất cả đời</option>
                {generations.map((gen) => <option key={gen} value={gen}>Đời {gen}</option>)}
              </select>
            </section>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">?</div>
                <h2 style={{ fontSize: 20, marginBottom: 8 }}>{search ? `Không tìm thấy '${search}'` : 'Chưa có thành viên nào'}</h2>
                <p style={{ color: 'var(--ink3)', marginBottom: 16 }}>Thêm thành viên hoặc đổi bộ lọc để xem danh sách.</p>
                <Link href={`/family/${familyId}/add`} className="btn btn-primary" style={{ textDecoration: 'none' }}>Thêm thành viên</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {filtered.map((person) => (
                  <Link key={person.id} href={`/family/${familyId}/person/${person.id}`} style={memberStyle}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: person.gender === 'FEMALE' ? 'var(--female-bg)' : 'var(--male-bg)', color: person.gender === 'FEMALE' ? 'var(--female-text)' : 'var(--male-text)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
                      {person.fullName.split(' ').pop()?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{person.fullName}</div>
                      <div style={{ color: 'var(--ink3)', fontSize: 13 }}>
                        Đời {person.generationNum ?? '?'} · {person.currentLocation || 'Chưa có nơi ở'} · {person.isAlive ? 'Còn sống' : 'Đã mất'}
                      </div>
                    </div>
                    {person.isRootAncestor && <span style={badgeStyle}>Thủy tổ</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

const toolbarStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 14,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(160px, 220px)',
  gap: 10,
  marginBottom: 14,
}

const memberStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  textDecoration: 'none',
}

const badgeStyle: React.CSSProperties = {
  background: 'var(--gold2)',
  color: '#92400E',
  borderRadius: 999,
  padding: '5px 9px',
  fontSize: 12,
  fontWeight: 800,
}
