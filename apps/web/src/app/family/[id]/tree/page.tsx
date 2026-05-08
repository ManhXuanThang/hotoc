'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getFamilyTree, getPerson } from '@/lib/api'
import Link from 'next/link'

interface Person {
  id: string; fullName: string; gender: string
  birthDate: string | null; deathDate: string | null
  isAlive: boolean; currentLocation: string | null
  generationNum: number | null; isRootAncestor: boolean
  isCurrentUser: boolean; avatarUrl: string | null
  relationsAsSource: { relatedPersonId: string; relationType: string }[]
}

export default function FamilyTreePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Person | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { router.push('/login'); return }
    getFamilyTree(params.id)
      .then(r => setPersons(r.data.persons))
      .catch(e => { if (e.response?.status === 401) router.push('/login') })
      .finally(() => setLoading(false))
  }, [params.id])

  // Group theo đời
  const byGen = persons.reduce((acc, p) => {
    const gen = p.generationNum ?? 99
    if (!acc[gen]) acc[gen] = []
    acc[gen].push(p)
    return acc
  }, {} as Record<number, Person[]>)

  const gens = Object.keys(byGen).map(Number).sort((a, b) => a - b)

  const filtered = search
    ? persons.filter(p => p.fullName.toLowerCase().includes(search.toLowerCase()))
    : []

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sand)' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 40 }}>🌳</div><p style={{ color: 'var(--ink3)', marginTop: 8 }}>Đang tải cây gia phả...</p></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--sand)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '14px 16px', borderBottom: '1px solid var(--sand3)', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/dashboard" style={{ color: 'var(--ink3)', textDecoration: 'none', fontSize: 20 }}>‹</Link>
        <h1 style={{ flex: 1, fontSize: 17, margin: 0 }}>Cây Gia Phả</h1>
        <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{persons.length} người</span>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid var(--sand3)' }}>
        <input
          style={{ background: 'var(--sand)', border: 'none', borderRadius: 20, padding: '9px 16px', fontSize: 13, color: 'var(--ink)', width: '100%', outline: 'none' }}
          placeholder="🔍  Tìm thành viên..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        {search && filtered.length > 0 && (
          <div style={{ position: 'absolute', background: '#fff', border: '1px solid var(--sand3)', borderRadius: 12, marginTop: 4, zIndex: 20, width: 'calc(100% - 32px)', maxHeight: 200, overflow: 'auto' }}>
            {filtered.map(p => (
              <div key={p.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--sand3)', cursor: 'pointer', fontSize: 14 }}
                onClick={() => { setSelected(p); setSearch('') }}>
                {p.fullName} <span style={{ color: 'var(--ink3)', fontSize: 12 }}>· Đời {p.generationNum}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tree */}
      <div style={{ flex: 1, padding: '16px 12px', overflowX: 'auto' }}>
        {gens.map((gen, gi) => (
          <div key={gen}>
            {/* Gen label */}
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink4)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8, marginTop: gi > 0 ? 4 : 0 }}>
              Đời {gen} {gen === Math.max(...gens) ? '— Thế hệ hiện tại' : ''}
            </div>

            {/* Connector line */}
            {gi > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                <div style={{ width: 1, height: 12, background: 'var(--sand3)' }} />
              </div>
            )}

            {/* Nodes */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              {byGen[gen].map(p => (
                <div key={p.id} onClick={() => setSelected(p)}
                  style={{
                    background: p.isCurrentUser ? 'var(--teal)' : '#fff',
                    border: `1px solid ${p.isCurrentUser ? 'var(--teal)' : 'var(--sand3)'}`,
                    borderRadius: 12, padding: '8px 12px', cursor: 'pointer',
                    minWidth: 80, textAlign: 'center',
                    opacity: p.isAlive ? 1 : 0.65,
                    transition: 'all .15s',
                    boxShadow: selected?.id === p.id ? '0 0 0 2px var(--gold)' : 'none',
                  }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: p.isCurrentUser ? '#fff' : 'var(--ink)', lineHeight: 1.4 }}>
                    {p.fullName.split(' ').slice(-2).join(' ')}
                  </div>
                  {!p.isAlive && <div style={{ fontSize: 9, color: p.isCurrentUser ? 'rgba(255,255,255,.6)' : 'var(--ink4)', marginTop: 2 }}>†</div>}
                  {p.isCurrentUser && <div style={{ fontSize: 8, background: 'var(--gold)', color: '#fff', borderRadius: 6, padding: '1px 4px', marginTop: 3, display: 'inline-block' }}>★ Bạn</div>}
                  {p.currentLocation && (
                    <div style={{ fontSize: 9, color: p.isCurrentUser ? 'rgba(255,255,255,.6)' : 'var(--ink4)', marginTop: 2 }}>
                      📍 {p.currentLocation.split('.').pop()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Profile sheet khi click */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setSelected(null)}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: 20, maxHeight: '70vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: 'var(--sand3)', borderRadius: 2, margin: '0 auto 16px' }} />

            {/* Avatar */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: selected.isCurrentUser ? 'var(--teal)' : 'var(--gold2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, color: selected.isCurrentUser ? '#fff' : 'var(--gold)', flexShrink: 0, fontFamily: 'Lora, serif' }}>
                {selected.fullName.split(' ').pop()?.[0]}
              </div>
              <div>
                <h2 style={{ fontSize: 18, margin: '0 0 2px', fontFamily: 'Lora, serif' }}>{selected.fullName}</h2>
                <p style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 500, margin: '0 0 6px' }}>Đời thứ {selected.generationNum}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {!selected.isAlive && <span style={{ fontSize: 10, background: 'var(--red2)', color: 'var(--red)', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>Đã mất</span>}
                  {selected.isCurrentUser && <span style={{ fontSize: 10, background: 'var(--teal2)', color: 'var(--teal)', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>★ Bạn</span>}
                  {selected.isRootAncestor && <span style={{ fontSize: 10, background: 'var(--gold2)', color: 'var(--gold)', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>Thủy tổ</span>}
                </div>
              </div>
            </div>

            {/* Thông tin */}
            <div style={{ background: 'var(--sand)', borderRadius: 12, padding: '4px 14px', marginBottom: 12 }}>
              {selected.birthDate && <InfoRow icon="🎂" label="Năm sinh" value={new Date(selected.birthDate).getFullYear().toString()} />}
              {selected.deathDate && <InfoRow icon="✝" label="Năm mất" value={new Date(selected.deathDate).getFullYear().toString()} />}
              {selected.currentLocation && <InfoRow icon="📍" label="Nơi ở" value={selected.currentLocation} />}
              {selected.gender !== 'UNKNOWN' && <InfoRow icon="👤" label="Giới tính" value={selected.gender === 'MALE' ? 'Nam' : 'Nữ'} last />}
            </div>

            {/* Quan hệ */}
            {selected.relationsAsSource.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Quan hệ</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selected.relationsAsSource.slice(0, 6).map(r => {
                    const related = persons.find(p => p.id === r.relatedPersonId)
                    if (!related) return null
                    const relLabel: Record<string, string> = { PARENT: 'Con', SPOUSE: 'Vợ/Chồng', SIBLING: 'Anh/Chị/Em' }
                    return (
                      <div key={r.relatedPersonId} onClick={() => setSelected(related)}
                        style={{ background: '#fff', border: '1px solid var(--sand3)', borderRadius: 20, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                        <span style={{ color: 'var(--ink3)', marginRight: 4 }}>{relLabel[r.relationType] ?? r.relationType}</span>
                        <span style={{ fontWeight: 500 }}>{related.fullName.split(' ').slice(-2).join(' ')}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <button onClick={() => setSelected(null)}
              style={{ marginTop: 16, background: 'var(--sand)', border: 'none', borderRadius: 10, padding: '12px', width: '100%', fontSize: 14, color: 'var(--ink3)', cursor: 'pointer', fontFamily: 'inherit' }}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: last ? 'none' : '1px solid var(--sand3)' }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 12, color: 'var(--ink3)', width: 70 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--ink)', flex: 1 }}>{value}</span>
    </div>
  )
}
