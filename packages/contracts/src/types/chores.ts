import { tags } from "typia";

// ── User types ──

export type UserRole = "adult" | "kid";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ── Plain types (for database operations) ──

export interface PlainChore {
  id: string;
  userId: string;
  name: string;
  baseValue: number;
  timesPerWeek: number;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlainChoreExtra {
  id: string;
  userId: string;
  name: string;
  value: number;
  weekKey: string;
  createdAt?: string;
}

export interface PlainChoreCheck {
  id: string;
  userId: string;
  choreId?: string;
  choreExtraId?: string;
  weekKey: string;
  dayIndex: number;
  checkedAt?: string;
}

// ── Typia-enhanced types (for validation / API contracts) ──

export interface Chore extends PlainChore {
  id: string & tags.Format<"uuid">;
  userId: string & tags.Format<"uuid">;
  name: string & tags.MinLength<1> & tags.MaxLength<200>;
  baseValue: number;
  timesPerWeek: number & tags.Type<"int32"> & tags.Minimum<1> & tags.Maximum<7>;
  sortOrder: number & tags.Type<"int32">;
  createdAt?: string & tags.Format<"date-time">;
  updatedAt?: string & tags.Format<"date-time">;
}

export interface ChoreExtra extends PlainChoreExtra {
  id: string & tags.Format<"uuid">;
  userId: string & tags.Format<"uuid">;
  name: string & tags.MinLength<1> & tags.MaxLength<200>;
  value: number;
  weekKey: string & tags.MinLength<1> & tags.MaxLength<10>;
  createdAt?: string & tags.Format<"date-time">;
}

export interface ChoreCheck extends PlainChoreCheck {
  id: string & tags.Format<"uuid">;
  userId: string & tags.Format<"uuid">;
  choreId?: string & tags.Format<"uuid">;
  choreExtraId?: string & tags.Format<"uuid">;
  weekKey: string & tags.MinLength<1> & tags.MaxLength<10>;
  dayIndex: number & tags.Type<"int32"> & tags.Minimum<0> & tags.Maximum<6>;
  checkedAt?: string & tags.Format<"date-time">;
}

// ── Input types (userId added by server from JWT) ──

export interface CreateChoreInput {
  name: string;
  baseValue: number;
  timesPerWeek: number;
  sortOrder?: number;
}

export interface UpdateChoreInput {
  name?: string;
  baseValue?: number;
  timesPerWeek?: number;
  sortOrder?: number;
  isActive?: boolean;
}

// ── Weekly Snapshot types ──

export interface WeeklySnapshot {
  id: string;
  weekKey: string;
  userId: string;
  snapshotData: ChoreWeeklySummary;
  paidAt: string;
  createdAt: string;
}

export interface CreateSnapshotInput {
  weekKey: string;
}

export interface CreateChoreExtraInput {
  name: string;
  value: number;
  weekKey: string;
}

export interface ToggleCheckInput {
  choreId?: string;
  choreExtraId?: string;
  weekKey: string;
  dayIndex: number;
}

// ── Bonus Settings ──

export interface BonusSettings {
  id: string;
  userId: string;
  overCompletionBonusPercent: number; // e.g., 50 for 50%
  allChoresCompleteBonusPercent: number; // e.g., 25 for 25%
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateBonusSettingsInput {
  overCompletionBonusPercent?: number;
  allChoresCompleteBonusPercent?: number;
}

// ── Weekly summary (computed by API) ──

export interface ChoreWeeklySummary {
  chores: (Chore & { completions: number; earned: number })[];
  extras: (ChoreExtra & { completions: number; earned: number })[];
  checks: ChoreCheck[];
  baseEarned: number;
  extrasEarned: number;
  bonusAmount: number;
  grandTotal: number;
  completionRate: number;
  bonusActive: boolean;
  bonusSettings: BonusSettings;
  isPaid?: boolean; // True if this week has been paid (snapshot exists)
}
