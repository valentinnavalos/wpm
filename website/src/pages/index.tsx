import Script from "next/script";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
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
  padding: "6px 14px",
  background: "transparent",
  color: "#03ff57",
  border: "1px solid #03ff57",
  borderRadius: 0,
  fontSize: 13,
  fontFamily: "monospace",
  letterSpacing: "0.05em",
} as const;

const AVATAR_STYLE = {
  borderRadius: "50%",
  width: 38,
  cursor: "pointer",
  display: "block",
  border: "2px solid #03ff57",
} as const;

const DROPDOWN_STYLE = {
  position: "absolute" as const,
  top: 46,
  right: 0,
  background: "#000",
  border: "1px solid #03ff57",
  padding: "4px 0",
  fontFamily: "monospace",
  fontSize: 13,
  zIndex: 1001,
  minWidth: 130,
} as const;

const DROPDOWN_ITEM_STYLE = {
  padding: "6px 14px",
  cursor: "pointer",
  color: "#fff",
  display: "block",
  whiteSpace: "nowrap" as const,
} as const;

export default function Home() {
  const { data: session, status } = useSession();
  const gameSessionId = useRef<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

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
              Login with GitHub
            </button>
          ) : (
            <div style={{ position: "relative" }}>
              <Image
                src={session.user?.image || "/default-avatar.png"}
                alt={session.user?.name || "User avatar"}
                width={38}
                height={38}
                style={AVATAR_STYLE}
                priority
                onClick={() => setShowMenu((v) => !v)}
                title={session.user?.name || ""}
              />
              {showMenu && (
                <>
                  <div
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 1000,
                      background: "rgba(0,0,0,0.35)",
                      backdropFilter: "blur(2px)",
                    }}
                    onClick={() => setShowMenu(false)}
                  />
                  <div style={DROPDOWN_STYLE}>
                    <span
                      style={DROPDOWN_ITEM_STYLE}
                      onClick={() => { setShowMenu(false); window.location.href = "/leaderboard"; }}
                    >
                      leaderboard
                    </span>
                    <span
                      style={{ ...DROPDOWN_ITEM_STYLE, color: "#ff4d4d" }}
                      onClick={() => signOut()}
                    >
                      log out
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <Script src="/game/game.js" />
    </>
  );
}
