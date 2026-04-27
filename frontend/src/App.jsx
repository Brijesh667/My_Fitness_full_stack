import DayForm from './form/DayForm';

export default function App() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-100 to-slate-200 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="rounded-3xl bg-white p-8 shadow-lg border border-slate-200">
          <h1 className="text-4xl font-bold text-slate-900">MY Fitness Day Builder</h1>
          <p className="mt-3 text-slate-600 text-lg">Build your perfect workout day—add goals and exercises in one view.</p>
        </header>

        <DayForm />
      </div>
    </div>
  );
}