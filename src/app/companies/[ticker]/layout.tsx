"use client";

import { use } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function TickerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(params);
  const pathname = usePathname();

  return (
    // Зафіксована ширина контейнера, щоб макет не стрибав
    <div className="w-full max-w-4xl mx-auto px-8 py-8 overflow-hidden font-mono min-w-0 flex-none">
      {/* Назва компанії тепер тут, але її можна динамічно оновлювати */}
      <h1 className="text-2xl font-semibold mb-1">{ticker.toUpperCase()}</h1>
      
      <nav className="flex gap-4 mb-6 text-sm items-center border-b pb-4">
        {[
          { name: "Factors", path: "factors" },
          { name: "Prices", path: "prices" },
          { name: "Fundamentals", path: "fundamentals" },
        ].map((item) => {
          const isActive = pathname.includes(item.path);
          return (
            <Link
              key={item.path}
              href={`/companies/${ticker}/${item.path}`}
              className={`${
                isActive ? "font-bold text-black" : "text-blue-600 hover:underline"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="w-full min-w-0">
        {children}
      </div>
    </div>
  );
}