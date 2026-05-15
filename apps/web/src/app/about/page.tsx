import Link from 'next/link'

export default function AboutPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <section style={{ background: 'var(--topbar)', color: '#fff', padding: '56px 20px 48px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ color: '#fff', fontSize: 40, marginBottom: 12 }}>Họ Tộc</h1>
          <p style={{ color: 'rgba(255,255,255,.72)', fontSize: 18, maxWidth: 680 }}>
            Nơi dòng họ cùng số hóa cây gia phả, giữ ký ức gia đình và kết nối con cháu xa quê.
          </p>
        </div>
      </section>
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 20, display: 'grid', gap: 14 }}>
        {[
          ['Dựng cây rõ ràng', 'Thêm thành viên, quan hệ và thế hệ để mọi người hiểu mình thuộc nhánh nào.'],
          ['Mời người thân', 'Chia sẻ link mời để con cháu tham gia, bổ sung thông tin và xem cây.'],
          ['Giữ câu chuyện', 'Lưu tiểu sử, nơi ở, nghề nghiệp và những kỷ niệm đáng nhớ của từng người.'],
        ].map(([title, text]) => (
          <div key={title} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>{title}</h2>
            <p style={{ color: 'var(--ink3)' }}>{text}</p>
          </div>
        ))}
        <Link href="/login" className="btn btn-primary" style={{ textDecoration: 'none', width: 'fit-content' }}>Đăng nhập</Link>
      </section>
    </main>
  )
}
