import Navigation from "@/app/_components/layouts/Navigation";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cyan-50 dark:bg-slate-950">
      <Navigation />
      <div className="pt-16">{children}</div>
    </div>
  );
}
