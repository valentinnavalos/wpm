import Script from "next/script";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useRef } from "react";
import Image from "next/image";
import type { GameSession, GameResult, ExtendedUser } from "@src/types";

declare global {
  interface Window {
    __WPM_SESSION__?: GameSession | null;
    __WPM_LAST_RESULT__?: GameResult;
  }
}

const BUTTON_STYLE = {
  cursor: "pointer",
  padding: "6px 12px",
  background: "#24292e",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 14,
  fontFamily: "monospace",
} as const;

const AVATAR_STYLE = {
  borderRadius: "50%",
  width: 38,
  cursor: "pointer",
  display: "block",
} as const;

export default function Home() {
  const { data: session, status } = useSession();
  const gameSessionId = useRef<string | null>(null);

  useEffect(() => {
    const user = session?.user as ExtendedUser | undefined;
    window.__WPM_SESSION__ = session?.user
      ? {
        username: user?.githubUsername,
        avatar: session.user.image,
      }
      : null;
  }, [session]);

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.data?.type === "WPM_GAME_START") {
        if (!session?.user) return;
        const { language } = event.data.payload;

        try {
          const res = await fetch("/api/game/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language }),
          });

          if (!res.ok) {
            console.error("Failed to start game session:", await res.text());
            return;
          }

          const data = await res.json();
          gameSessionId.current = data.sessionId;

          window.__WPM_SESSION__ = {
            ...window.__WPM_SESSION__,
            gameSessionId: data.sessionId,
          };
        } catch (error) {
          console.error("Error starting game:", error);
        }
      }

      if (event.data?.type === "WPM_GAME_OVER") {
        if (!session?.user || !gameSessionId.current) return;
        const { wpm, chars_typed, errors, blocks } = event.data.payload;

        try {
          const res = await fetch("/api/game/finish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: gameSessionId.current,
              wpm,
              chars_typed,
              errors,
              blocks,
            }),
          });

          if (!res.ok) {
            console.error("Failed to finish game:", await res.text());
            return;
          }

          const result = await res.json();
          gameSessionId.current = null;

          window.__WPM_LAST_RESULT__ = result;
        } catch (error) {
          console.error("Error finishing game:", error);
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [session]);

  return (
    <>
      {status !== "loading" && (
        <div style={{ position: "fixed", top: 10, right: 10, zIndex: 1000 }}>
          {!session ? (
            <button onClick={() => signIn("github")} style={BUTTON_STYLE}>
              Login with GitHub to save score
            </button>
          ) : (
            <a href="/leaderboard" title={`${session.user?.name} — View leaderboard`}>
              <Image
                src={session.user?.image || "/default-avatar.png"}
                alt={session.user?.name || "User avatar"}
                width={38}
                height={38}
                style={AVATAR_STYLE}
                priority
              />
            </a>
          )}
        </div>
      )}

      <Script src="/game/game.js" />
    </>
  );
}
