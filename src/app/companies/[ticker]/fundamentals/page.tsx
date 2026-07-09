// src/app/companies/[ticker]/fundamentals/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CONCEPTS = [
  "revenues", "net_income", "eps_basic", "op_income", "tax_expense",
  "ocf", "equity", "assets", "eps_shares", "cash", "cost_of_revenue",
  "liabilities", "capex", "da", "interest_expense", "inventory",
  "long_term_debt", "debt_current", "shares",
];

type FundamentalRow = {
  periodEnd: string;
  filingDate: string;
  value: string | null;
  unit: string | null;
  form: string | null;
};

type FundamentalsResponse = {
  ticker: string;
  company_name: string;
  concept: string;
  data: FundamentalRow[];
};

export default function FundamentalsPage() {
  const params = useParams<{ ticker: string }>();
  const [concept, setConcept] = useState("revenues");
  const [result, setResult] = useState<FundamentalsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    
    fetch(`/api/companies/${params.ticker}/fundamentals?concept=${concept}`)
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? "unknown error");
        }
        return res.json();
      })
      .then((data) => {
        if (active) {
          setResult(data);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      });

    return () => { active = false; };
  }, [params.ticker, concept]);

  if (error) {
    return <main className="max-w-4xl mx-auto p-8">Помилка: {error}</main>;
  }

  const chartData = result?.data.map((row) => ({
    period: new Date(row.periodEnd).toLocaleDateString("en-GB"),
    value: row.value ? parseFloat(row.value) : null,
  }));

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        {result?.company_name ?? "Завантаження..."}
      </p>

      <Select value={concept} onValueChange={(v) => v && setConcept(v)}>
        <SelectTrigger className="w-48 mb-6">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONCEPTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
    
      {!result ? (
        <p className="text-sm text-muted-foreground">Завантаження...</p>
      ) : result.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Немає даних для {concept} по {result.ticker}.
        </p>
      ) : (
        <>
          <div className="h-64 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period End</TableHead>
                <TableHead>Filing Date</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Form</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...result.data].reverse().map((row) => (
                <TableRow key={`${row.periodEnd}-${row.filingDate}`}>
                  <TableCell>{new Date(row.periodEnd).toLocaleDateString("en-GB")}</TableCell>
                  <TableCell>{new Date(row.filingDate).toLocaleDateString("en-GB")}</TableCell>
                  <TableCell>
                    {row.value ? Number(row.value).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell>{row.unit ?? "—"}</TableCell>
                  <TableCell>{row.form ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </>
  );
}