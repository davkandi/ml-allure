export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
      {/* Admin Sidebar/Navigation will go here */}
      <main className="admin-main">{children}</main>
    </div>
  );
}
