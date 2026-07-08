"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Company = {
  companyId: number;
  ticker: string;
  companyName: string;
  gicsSector: string | null;
};

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // debounce 300ms — не шукаємо в БД на кожне натискання клавіші
    const timeout = setTimeout(() => {
      setLoading(true);
      const url = search
        ? `/api/companies?limit=200&q=${encodeURIComponent(search)}`
        : `/api/companies?limit=200`;

      fetch(url)
        .then((res) => res.json())
        .then((json) => {
          setCompanies(json.data);
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-1">MFERE — Factor Dataset</h1>
      <p className="text-sm text-muted-foreground mb-6">
        S&amp;P 500 equity factors, 2025–2026 slice
      </p>

      <Input
        placeholder="Пошук за тікером або назвою..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Завантаження...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Sector</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((c) => (
              <TableRow key={c.companyId}>
                <TableCell className="font-mono">
                  <Link
                    href={`/companies/${c.ticker}`}
                    className="font-mono text-blue-600 hover:underline"
                  >
                    {c.ticker}
                  </Link>
                </TableCell>
                <TableCell className="font-mono">{c.companyName}</TableCell>
                <TableCell className="font-mono">{c.gicsSector ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}