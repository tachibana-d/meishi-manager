import CardList from "@/components/ui/CardList";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <h1 className="font-bold text-slate-800 text-lg">名刺管理</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <CardList />
      </main>
    </div>
  );
}
