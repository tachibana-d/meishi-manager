import CardDetail from "@/components/ui/CardDetail";

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-slate-50" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        <CardDetail id={id} />
      </main>
    </div>
  );
}
