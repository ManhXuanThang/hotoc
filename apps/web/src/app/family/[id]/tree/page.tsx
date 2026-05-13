'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getFamilyTree, getFamily } from '@/lib/api'
import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

interface Person {
  id: string; fullName: string; gender: string
  birthDate: string | null; deathDate: string | null
  isAlive: boolean; currentLocation: string | null
  generationNum: number | null; isRootAncestor: boolean
  isCurrentUser: boolean; avatarUrl: string | null
  relationsAsSource: { relatedPersonId: string; relationType: string }[]
}

function initials(name: string) {
  return name.split(' ').pop()?.[0]?.toUpperCase() ?? '?'
}
function year(d: string | null) {
  return d ? new Date(d).getFullYear() : null
}
const REL: Record<string, string> = {
  PARENT: 'Con', SPOUSE: 'Vợ/Chồng', SIBLING: 'Anh/Chị/Em',
  ADOPTED_PARENT: 'Con nuôi', EX_SPOUSE: 'Vợ/Chồng cũ', HALF_SIBLING: 'Cùng cha khác mẹ'
}

function PersonCard({ p, selected, onClick }: { p: Person; selected: boolean; onClick: () => void }) {
  const gClass = p.gender === 'MALE' ? 'male' : p.gender === 'FEMALE' ? 'female' : 'male'
  const avClass = p.isCurrentUser ? 'you' : gClass
  return (
    <div className={`pcard${p.isCurrentUser ? ' you' : ''}${!p.isAlive ? ' dead' : ''}${selected ? ' selected' : ''}`} onClick={onClick}>
      {!p.isAlive && <span className="pcard-dead-mark">†</span>}
      <div className={`pcard-avatar ${avClass}`}>{initials(p.fullName)}</div>
      <div className="pcard-name">{p.fullName.split(' ').slice(-2).join(' ')}</div>
      <div className="pcard-year">
        {year(p.birthDate)}{p.deathDate ? `–${year(p.deathDate)}` : ''}
      </div>
      {p.currentLocation && (
        <div className="pcard-loc">
          <i className="ti ti-map-pin" aria-hidden="true" style={{ fontSize: 11 }} />
          {p.currentLocation}
        </div>
      )}
      <div className="pcard-chips">
        {p.isCurrentUser && <span className="pcard-chip chip-you">★ Bạn</span>}
        {p.isRootAncestor && <span className="pcard-chip chip-root">Thủy tổ</span>}
      </div>
    </div>
  )
}

function ProfileContent({ p, persons, onSelect }: { p: Person; persons: Person[]; onSelect: (p: Person) => void }) {
  const coverColor = p.isCurrentUser ? 'var(--primary)' : p.gender === 'MALE' ? 'var(--male-text)' : 'var(--female-text)'
  const avColor = coverColor
  return (
    <>
      <div className="panel-cover" style={{ background: coverColor }}>
        <div className="panel-cover-pattern" />
      </div>
      <div className="panel-avatar" style={{ background: avColor }}>{initials(p.fullName)}</div>
      <div className="panel-body">
        <h2 className="panel-name">{p.fullName}</h2>
        <p className="panel-role">Đời thứ {p.generationNum}{p.isRootAncestor ? ' · Thủy tổ' : ''}</p>
        <div className="panel-tags">
          {!p.isAlive && <span className="panel-tag" style={{ background: 'var(--red2)', color: 'var(--red)' }}>Đã mất</span>}
          {p.isCurrentUser && <span className="panel-tag" style={{ background: 'var(--primary2)', color: 'var(--primary)' }}>★ Bạn</span>}
          {p.gender === 'MALE' && <span className="panel-tag" style={{ background: 'var(--male-bg)', color: 'var(--male-text)' }}>Nam</span>}
          {p.gender === 'FEMALE' && <span className="panel-tag" style={{ background: 'var(--female-bg)', color: 'var(--female-text)' }}>Nữ</span>}
        </div>
        <div className="info-box">
          {p.birthDate && (
            <div className="info-row">
              <span className="info-icon">🎂</span>
              <span className="info-label">Năm sinh</span>
              <span className="info-value">{year(p.birthDate)}</span>
            </div>
          )}
          {p.deathDate && (
            <div className="info-row">
              <span className="info-icon">✝️</span>
              <span className="info-label">Năm mất</span>
              <span className="info-value">{year(p.deathDate)}</span>
            </div>
          )}
          {p.currentLocation && (
            <div className="info-row">
              <span className="info-icon">📍</span>
              <span className="info-label">Nơi ở</span>
              <span className="info-value">{p.currentLocation}</span>
            </div>
          )}
        </div>
        {p.relationsAsSource.length > 0 && (
          <>
            <div className="rels-title">Quan hệ trong cây</div>
            <div className="rels-list">
              {p.relationsAsSource.slice(0, 8).map(r => {
                const rp = persons.find(x => x.id === r.relatedPersonId)
                if (!rp) return null
                return (
                  <div key={rp.id} className="rel-chip" onClick={() => onSelect(rp)}>
                    <span className="rel-chip-label">{REL[r.relationType] ?? r.relationType} </span>
                    <span className="rel-chip-name">{rp.fullName.split(' ').slice(-2).join(' ')}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default function TreePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const familyId = params.id
  const [persons, setPersons] = useState<Person[]>([])
  const [family, setFamily] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Person | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { router.push('/login'); return }
    Promise.all([getFamilyTree(familyId), getFamily(familyId)])
      .then(([treeRes, famRes]) => {
        setPersons(treeRes.data.persons)
        setFamily(famRes.data)
      })
      .catch(e => { if (e.response?.status === 401) router.push('/login') })
      .finally(() => setLoading(false))
  }, [familyId])

  const byGen = persons.reduce((acc, p) => {
    const g = p.generationNum ?? 99
    if (!acc[g]) acc[g] = []
    acc[g].push(p)
    return acc
  }, {} as Record<number, Person[]>)
  const gens = Object.keys(byGen).map(Number).sort((a, b) => a - b)
  const maxGen = Math.max(...gens)

  const filtered = search.length > 1
    ? persons.filter(p => p.fullName.toLowerCase().includes(search.toLowerCase()))
    : []

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🌳</div>
        <p style={{ color: 'var(--ink3)' }}>Đang tải cây gia phả...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar familyId={familyId} />

      <div className="app-layout">
        <Sidebar
          familyId={familyId}
          familyName={family?.name ?? 'Dòng họ'}
          memberCount={persons.length}
        />

        <div className="main-content">
          {/* Toolbar */}
          <div className="tree-toolbar">
            <div>
              <div className="tree-toolbar-title">Cây Gia Phả</div>
              <div className="tree-toolbar-sub">{persons.length} thành viên · {gens.length} đời</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <input className="toolbar-search" placeholder="🔍 Tìm thành viên..."
                  value={search} onChange={e => setSearch(e.target.value)} />
                {filtered.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 50, overflow: 'hidden', minWidth: 220 }}>
                    {filtered.map(p => (
                      <div key={p.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}
                        onClick={() => { setSelected(p); setSearch('') }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: p.gender === 'MALE' ? 'var(--male-bg)' : 'var(--female-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: p.gender === 'MALE' ? 'var(--male-text)' : 'var(--female-text)', flexShrink: 0 }}>
                          {initials(p.fullName)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.fullName}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Đời {p.generationNum} · {p.currentLocation ?? ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn btn-primary" onClick={() => router.push(`/family/${familyId}/add`)} style={{ display: 'none' }}>
                + Thêm
              </button>
            </div>
          </div>

          <div className="tree-layout">
            {/* Tree canvas */}
            <div className="tree-canvas">
              {gens.map((gen, gi) => (
                <div key={gen}>
                  {gi > 0 && (
                    <div className="gen-connector">
                      <div className="gen-connector-line" />
                    </div>
                  )}
                  <div className="gen-section">
                    <div className="gen-header">
                      <span className="gen-label">Đời {gen}</span>
                      <span className="gen-count">{byGen[gen].length} người</span>
                      {gen === maxGen && <span className="gen-badge">Thế hệ hiện tại</span>}
                    </div>
                    <div className="gen-cards">
                      {byGen[gen].map(p => (
                        <PersonCard key={p.id} p={p}
                          selected={selected?.id === p.id}
                          onClick={() => setSelected(p)} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, paddingTop: 16, borderTop: '1px solid var(--border)', marginTop: 8, flexWrap: 'wrap' }}>
                {[['var(--male-bg)', 'var(--male-text)', 'Nam'], ['var(--female-bg)', 'var(--female-text)', 'Nữ'], ['var(--primary)', '#fff', 'Bạn']].map(([bg, , label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink3)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: bg }} />{label}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink3)' }}>
                  <span>†</span> Đã mất
                </div>
              </div>
            </div>

            {/* Right panel — desktop only */}
            <div className="tree-panel">
              <div className="panel-header">
                <div className="panel-header-title">Hồ sơ thành viên</div>
                <div className="panel-header-sub">
                  {selected ? `Đang xem: ${selected.fullName}` : 'Click vào người để xem chi tiết'}
                </div>
              </div>
              {selected ? (
                <ProfileContent p={selected} persons={persons} onSelect={setSelected} />
              ) : (
                <div className="panel-empty">
                  <i className="ti ti-user" style={{ fontSize: 32 }} aria-hidden="true" />
                  Chọn một thành viên trong cây để xem thông tin
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-nav">
        <button className="mobile-nav-btn" onClick={() => router.push('/dashboard')}>
          <i className="ti ti-home" aria-hidden="true" /><span>Trang chủ</span>
        </button>
        <button className="mobile-nav-btn active">
          <i className="ti ti-hierarchy" aria-hidden="true" /><span>Cây họ</span>
        </button>
        <button className="mobile-nav-btn" onClick={() => router.push(`/family/${familyId}/add`)}>
          <i className="ti ti-plus" aria-hidden="true" /><span>Thêm</span>
        </button>
        <button className="mobile-nav-btn">
          <i className="ti ti-bell" aria-hidden="true" /><span>Thông báo</span>
        </button>
        <button className="mobile-nav-btn" onClick={() => router.push(`/family/${familyId}/admin`)}>
          <i className="ti ti-settings" aria-hidden="true" /><span>Quản lý</span>
        </button>
      </div>

      {/* Mobile profile sheet */}
      {selected && (
        <>
          <div className="mobile-overlay" onClick={() => setSelected(null)}
            style={{ display: 'block' }}
            // Hide on desktop (panel handles it there)
          />
          <div className="mobile-sheet" style={{ display: 'block' }}>
            <div className="sheet-handle" />
            <div style={{ position: 'relative' }}>
              <button onClick={() => setSelected(null)}
                style={{ position: 'absolute', top: 8, right: 12, zIndex: 10, background: 'rgba(0,0,0,.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
              <ProfileContent p={selected} persons={persons} onSelect={(p) => { setSelected(p) }} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
