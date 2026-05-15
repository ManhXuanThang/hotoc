import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <section className="empty-state" style={{ maxWidth: 520 }}>
        <div className="empty-state-icon">404</div>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Không tìm thấy trang</h1>
        <p style={{ color: 'var(--ink3)', marginBottom: 18 }}>
          Đường dẫn này không tồn tại hoặc bạn chưa có quyền xem nội dung.
        </p>
        <Link href="/dashboard" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Về trang chủ
        </Link>
      </section>
    </main>
  )
}
