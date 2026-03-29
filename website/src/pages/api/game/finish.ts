import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

const MIN_GAME_SECONDS = 30;
const MAX_WPM = 300;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  const supabaseId = (session?.user as any)?.supabaseId;
  if (!supabaseId) return res.status(401).json({ error: "Not authenticated" });

  const { sessionId, wpm: clientWpm, chars_typed, errors, blocks } = req.body;

  if (!sessionId || typeof clientWpm !== "number" || typeof chars_typed !== "number" || typeof errors !== "number") {
    return res.status(400).json({ error: "Missing fields" });
  }

  // 1. Load and validate the game session
  const { data: gameSession, error: sessionError } = await supabaseAdmin
    .from("game_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || !gameSession) {
    return res.status(404).json({ error: "Session not found" });
  }

  // 2. Ensure the session belongs to the authenticated user
  if (gameSession.user_id !== supabaseId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // 3. Ensure it was not already closed
  if (gameSession.is_valid) {
    return res.status(409).json({ error: "Session already finished" });
  }

  // 4. Real elapsed time
  const finishedAt = new Date();
  const startedAt = new Date(gameSession.started_at);
  const elapsedSeconds = (finishedAt.getTime() - startedAt.getTime()) / 1000;

  if (elapsedSeconds < MIN_GAME_SECONDS) {
    return res.status(400).json({ error: "Game too short" });
  }

  console.log("WPM_GAME_OVER", {
    sessionId,
    wpm: clientWpm,
    chars_typed,
    errors,
    blocks,
  });

  // 5. Use client-provided WPM; derive acc server-side from chars (timing-independent)
  const wpm = Math.round(clientWpm);
  const totalChars = chars_typed + errors;
  const acc = totalChars > 0 ? (chars_typed / totalChars) * 100 : 100;
  const awpm = Math.round(wpm * (acc / 100));

  // 6. Final sanity check
  if (wpm > MAX_WPM) {
    return res.status(400).json({ error: "Implausible WPM" });
  }

  // 7. Persist score
  const { data: score, error: scoreError } = await supabaseAdmin
    .from("scores")
    .insert({
      user_id:    supabaseId,
      session_id: sessionId,
      wpm,
      awpm,
      acc:        Number(acc.toFixed(2)),
      language:   gameSession.language,
      blocks:     Math.min(Math.max(0, blocks ?? 0), 5),
    })
    .select("id")
    .single();

  if (scoreError) return res.status(500).json({ error: scoreError.message });

  // 8. Mark session as valid and closed
  await supabaseAdmin
    .from("game_sessions")
    .update({
      finished_at: finishedAt.toISOString(),
      chars_typed,
      errors,
      blocks: Math.min(Math.max(0, blocks ?? 0), 5),
      is_valid: true,
      score_id: score.id,
    })
    .eq("id", sessionId);

  // 9. User rank for end-game UI
  const { count } = await supabaseAdmin
    .from("leaderboard")
    .select("*", { count: "exact", head: true })
    .gt("wpm", wpm);

  const rank = (count ?? 0) + 1;

  return res.status(201).json({ wpm, awpm, acc: Number(acc.toFixed(1)), rank });
}
