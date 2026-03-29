import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@src/lib/supabase";

const VIEWS = {
  alltime: "leaderboard",
  weekly:  "leaderboard_weekly",
  monthly: "leaderboard_monthly",
} as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const { period = "alltime", language, limit = "100" } = req.query;

  const viewName = VIEWS[period as keyof typeof VIEWS] ?? VIEWS.alltime;

  let query = supabaseAdmin
    .from(viewName)
    .select("*")
    .order("wpm", { ascending: false })
    .limit(Math.min(Number(limit), 200));

  if (language && language !== "all") {
    query = query.eq("language", language as string);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json(data);
}
