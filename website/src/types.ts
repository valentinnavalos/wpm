export interface ExtendedUser {
  githubUsername?: string;
  supabaseId?: string;
}

export interface GameSession {
  username?: string;
  avatar?: string | null;
  gameSessionId?: string;
}

export interface GameResult {
  wpm: number;
  awpm: number;
  acc: number;
  rank: number;
}

export interface Score {
  id: string;
  username: string;
  avatar_url: string;
  wpm: number;
  awpm: number;
  acc: number;
  language: string;
  blocks: number;
  created_at: string;
}
