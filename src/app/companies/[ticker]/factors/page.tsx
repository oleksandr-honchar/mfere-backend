"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Рядок факторів — довільний набір ключів, бо рендеримо динамічно
type FactorRow = Record<string, string | number | null> & { date: string };

type FactorsResponse = {
  ticker: string;
  company_name: string;
  data: FactorRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

// Ці два поля не показуємо як "фактор" — вони йдуть в шапку рядка окремо
const EXCLUDED_KEYS = ["companyId", "date"];

export default function CompanyPage() {
  const params = useParams<{ ticker: string }>();
  const [result, setResult] = useState<FactorsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/companies/${params.ticker}/factors?page=${page}`)
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? "unknown error");
        }
        return res.json();
      })
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [params.ticker, page]);

  if (error) {
    return <main className="max-w-4xl mx-auto p-8">Помилка: {error}</main>;
  }

  if (!result) {
    return <main className="max-w-4xl mx-auto p-8">Завантаження...</main>;
  }

  if (result.data.length === 0) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        Факторів для {result.ticker} не знайдено.
      </main>
    );
  }

  // Список факторів беремо з ключів першого рядка — так таблиця сама
  // підлаштується під schema, без хардкоду назв колонок
  const factorKeys = Object.keys(result.data[0]).filter(
    (key) => !EXCLUDED_KEYS.includes(key)
  );

  const formatValue = (value: string | number | null) => {
    if (value === null) return "—";
    if (typeof value === "number") return value.toFixed(3);
    return value;
  };

  return (
    <>
      <p className="text-sm font-mono text-muted-foreground mb-6">{result.company_name}</p>

      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background font-mono">Date</TableHead>
              {factorKeys.map((key) => (
                <TableHead key={key} className="whitespace-nowrap font-mono">
                  {key}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((row) => (
              <TableRow key={row.date}>
                <TableCell className="sticky left-0 bg-background font-mono">
                  {new Date(row.date).toLocaleDateString("en-GB")}
                </TableCell>
                {factorKeys.map((key) => (
                  <TableCell key={key} className="whitespace-nowrap font-mono">
                    {formatValue(row[key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="font-mono flex items-center justify-between mt-4">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Свіжіші
        </Button>
        <span className="text-sm text-muted-foreground">
          Сторінка {result.page} з {result.totalPages} (усього дат: {result.total})
        </span>
        <Button
          variant="outline"
          disabled={page >= result.totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Старіші
        </Button>
      </div>
    </>
  );
}