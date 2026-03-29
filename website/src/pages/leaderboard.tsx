import { supabaseAdmin } from "@src/lib/supabase";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { Score } from "@src/types";

const PERIODS = [
  { key: "alltime", label: "All Time" },
  { key: "monthly", label: "This Month" },
  { key: "weekly", label: "This Week" },
];

const LANGUAGES = ["all", "javascript", "python", "golang"];

const VIEWS: Record<string, string> = {
  alltime: "leaderboard",
  weekly: "leaderboard_weekly",
  monthly: "leaderboard_monthly",
};

const STYLES = {
  main: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "32px 16px",
    fontFamily: "monospace",
  },
  heading: {
    fontSize: 32,
    marginBottom: 24,
  },
  filterContainer: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
  },
  filterButton: (isActive: boolean) => ({
    padding: isActive ? "6px 16px" : "4px 12px",
    cursor: "pointer",
    borderRadius: 6,
    border: "1px solid #555",
    background: isActive ? "#24292e" : "transparent",
    color: isActive ? "#fff" : "inherit",
    fontFamily: "monospace",
    fontWeight: isActive ? "bold" : "normal",
  }),
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  tableRow: (index: number) => ({
    borderBottom: "1px solid #222",
    background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
  }),
  tableCell: {
    padding: "8px 12px",
  },
  avatarContainer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    borderRadius: "50%",
  },
} as const;

export async function getServerSideProps({ query }: { query: Record<string, string> }) {
  try {
    const period = query.period || "alltime";
    const language = query.language || "all";

    const viewName = VIEWS[period] ?? "leaderboard";

    let q = supabaseAdmin
      .from(viewName)
      .select("*")
      .order("wpm", { ascending: false })
      .limit(100);

    if (language !== "all") q = q.eq("language", language);

    const { data: scores, error } = await q;

    if (error) {
      console.error("Failed to fetch leaderboard:", error);
      return { props: { scores: [], period, language, error: error.message } };
    }

    return { props: { scores: scores ?? [], period, language } };
  } catch (error) {
    console.error("Unexpected error in getServerSideProps:", error);
    return { props: { scores: [], period: "alltime", language: "all", error: "Failed to load leaderboard" } };
  }
}

export default function Leaderboard({
  scores,
  period,
  language,
  error,
}: {
  scores: Score[];
  period: string;
  language: string;
  error?: string;
}) {
  const router = useRouter();

  const navigate = (params: Partial<{ period: string; language: string }>) => {
    router.push({ pathname: "/leaderboard", query: { period, language, ...params } });
  };

  return (
    <main style={STYLES.main}>
      <h1 style={STYLES.heading}>🏆 Leaderboard</h1>

      {error && (
        <div style={{ padding: 12, marginBottom: 24, background: "rgba(255,0,0,0.1)", borderRadius: 6, color: "#ff6b6b" }}>
          {error}
        </div>
      )}

      {/* Period filters */}
      <div style={STYLES.filterContainer}>
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => navigate({ period: p.key })}
            style={STYLES.filterButton(period === p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Language filters */}
      <div style={{ ...STYLES.filterContainer, marginBottom: 24 }}>
        {LANGUAGES.map((l) => (
          <button
            key={l}
            onClick={() => navigate({ language: l })}
            style={{
              ...STYLES.filterButton(language === l),
              padding: "4px 12px",
              background: language === l ? "#3a3a3a" : "transparent",
            }}
          >
            {l === "all" ? "All Languages" : l}
          </button>
        ))}
      </div>

      {/* Table */}
      {scores.length === 0 ? (
        <p style={{ color: "#888" }}>No scores yet for this filter.</p>
      ) : (
        <table style={STYLES.table}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
              <th style={STYLES.tableCell}>#</th>
              <th style={STYLES.tableCell}>User</th>
              <th style={STYLES.tableCell}>WPM</th>
              <th style={STYLES.tableCell}>AWPM</th>
              <th style={STYLES.tableCell}>Acc</th>
              <th style={STYLES.tableCell}>Language</th>
              <th style={STYLES.tableCell}>Blocks</th>
              <th style={STYLES.tableCell}>Date</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, i) => (
              <tr key={score.id} style={STYLES.tableRow(i)}>
                <td style={{ ...STYLES.tableCell, color: i < 3 ? "#FFD700" : "inherit" }}>
                  {i + 1}
                </td>
                <td style={{ ...STYLES.tableCell, ...STYLES.avatarContainer }}>
                  {score.avatar_url && (
                    <Image
                      src={score.avatar_url}
                      alt={score.username}
                      width={24}
                      height={24}
                      style={STYLES.avatar}
                    />
                  )}
                  {score.username}
                </td>
                <td style={{ ...STYLES.tableCell, fontWeight: "bold", color: "#FFD700" }}>
                  {score.wpm}
                </td>
                <td style={STYLES.tableCell}>{score.awpm}</td>
                <td style={STYLES.tableCell}>{score.acc}%</td>
                <td style={STYLES.tableCell}>{score.language}</td>
                <td style={STYLES.tableCell}>{score.blocks}/5</td>
                <td style={{ ...STYLES.tableCell, color: "#888" }}>
                  {new Date(score.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 32 }}>
        <Link href="/" style={{ color: "#888", textDecoration: "none" }}>
          ← Back to game
        </Link>
      </div>
    </main>
  );
}
