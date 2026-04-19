import Timer from "@/components/Timer";
import TodoPanel from "@/components/TodoPanel";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black gap-16">
      <Timer />
      <TodoPanel />
    </main>
  );
}
