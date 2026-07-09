// src/app/companies/[ticker]/prices/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PriceRow = {
  tradeDate: string;
  open: string | null;
  high: string | null;
  low: string | null;
  close: string | null;
  adjClose: string;
  volume: string | null;
};

type PricesResponse = {
  ticker: string;
  company_name: string;
  data: PriceRow[];
};

const PAGE_SIZE = 12;

export default function PricesPage() {
  const params = useParams<{ ticker: string }>();
  const [result, setResult] = useState<PricesResponse | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/companies/${params.ticker}/prices`)
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? "unknown error");
        }
        return res.json();
      })
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [params.ticker]);

  if (error) {
    return <main className="max-w-4xl mx-auto p-8">Помилка: {error}</main>;
  }

  if (!result) {
    return <main className="max-w-4xl mx-auto p-8">Завантаження...</main>;
  }

  // Drizzle numeric() повертає string — конвертуємо для графіка
  const chartData = result.data.map((row) => ({
    date: new Date(row.tradeDate).toLocaleDateString("en-GB"),
    adjClose: parseFloat(row.adjClose),
  }));

  // Пагінація таблиці — на найновіших датах спочатку, окремо від хронології графіка
  const tableRows = [...result.data].reverse();
  const totalPages = Math.ceil(tableRows.length / PAGE_SIZE);
  const pageRows = tableRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        {result?.company_name ?? "Завантаження..."}
      </p>

      <div className="h-64 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="adjClose" stroke="#2563eb" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Open</TableHead>
            <TableHead>High</TableHead>
            <TableHead>Low</TableHead>
            <TableHead>Close</TableHead>
            <TableHead>Adj Close</TableHead>
            <TableHead>Volume</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((row) => (
            <TableRow key={row.tradeDate}>
              <TableCell>{new Date(row.tradeDate).toLocaleDateString("en-GB")}</TableCell>
              <TableCell>{row.open ? parseFloat(row.open).toFixed(2) : "—"}</TableCell>
              <TableCell>{row.high ? parseFloat(row.high).toFixed(2) : "—"}</TableCell>
              <TableCell>{row.low ? parseFloat(row.low).toFixed(2) : "—"}</TableCell>
              <TableCell>{row.close ? parseFloat(row.close).toFixed(2) : "—"}</TableCell>
              <TableCell>{parseFloat(row.adjClose).toFixed(2)}</TableCell>
              <TableCell>{row.volume ? Number(row.volume).toLocaleString() : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between mt-4">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Свіжіші
        </Button>
        <span className="text-sm text-muted-foreground">
          Сторінка {page} з {totalPages}
        </span>
        <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Старіші
        </Button>
      </div>
    </>
  );
}