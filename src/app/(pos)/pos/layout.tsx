export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pos-layout">
      {/* POS Navigation will go here */}
      <main className="pos-main">{children}</main>
    </div>
  );
}
