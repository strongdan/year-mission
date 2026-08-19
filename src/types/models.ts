import type { Json } from "@/integrations/supabase/types";

export interface Profile {
  id: string;
  display_name: string | null;
  timezone: string;
  preferences: Json;
  created_at: string;
}

export interface Plan {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export interface Domain {
  id: string;
  user_id: string;
  slug: "money" | "body" | "home" | "capability";
  title: string;
  objective: string | null;
  current_level: string;
  progress_score: number;
  created_at: string;
}

export interface Season {
  id: string;
  plan_id: string;
  name: string;
  sequence: number;
  start_date: string;
  end_date: string;
  objective: string | null;
}

export interface MonthlyFocus {
  id: string;
  user_id: string;
  month: number;
  year: number;
  title: string;
  description: string | null;
  domain_id: string | null;
}

export interface Project {
  id: string;
  user_id: string;
  domain_id: string | null;
  title: string;
  description: string | null;
  status: string;
  target_date: string | null;
  priority: string;
  created_at: string;
  completed_at: string | null;
}

export type TaskStatus =
  | "inbox"
  | "backlog"
  | "this_week"
  | "today"
  | "in_progress"
  | "completed"
  | "dropped";

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  domain_id: string | null;
  title: string;
  notes: string | null;
  status: TaskStatus;
  estimated_minutes: number | null;
  impact: "low" | "medium" | "high";
  priority: string;
  scheduled_date: string | null;
  due_date: string | null;
  weekly_commitment: boolean;
  weekly_win: boolean;
  defer_count: number;
  courage_task: boolean;
  meta_work: boolean;
  source: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  domain?: Pick<Domain, "slug" | "title"> | null;
  project?: Pick<Project, "title"> | null;
}

export interface TaskEvent {
  id: string;
  user_id: string;
  task_id: string | null;
  event_type: string;
  event_data: Json;
  created_at: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  date: string;
  alcohol_free: boolean;
  weight: number | null;
  steps: number | null;
  water: number | null;
  mood: number | null;
  energy: number | null;
  sleep_hours: number | null;
  notes: string | null;
}

export interface Workout {
  id: string;
  user_id: string;
  date: string;
  type: string;
  duration_minutes: number | null;
  notes: string | null;
  metadata: Json;
}

export interface FinancialSnapshot {
  id: string;
  user_id: string;
  date: string;
  consumer_debt: number;
  cash_reserve: number | null;
  notes: string | null;
}

export interface HouseProgress {
  id: string;
  user_id: string;
  date: string;
  readiness_score: number;
  notes: string | null;
}

export interface WeeklyMode {
  id: string;
  user_id: string;
  week_start: string;
  mode: "push" | "normal" | "maintenance" | "recovery";
  note: string | null;
}

export interface WeeklyReview {
  id: string;
  user_id: string;
  week_start: string;
  mode: string | null;
  score: number | null;
  wins: Json;
  difficulties: Json;
  lessons: Json;
  next_week_focus: string | null;
  weekly_win_id: string | null;
  what_went_well: string | null;
  what_didnt_happen: string | null;
  why_not: string | null;
  learned_about_self: string | null;
  overcommitted: boolean | null;
  avoided_what: string | null;
  uncomfortable_next: string | null;
  stop_doing: Json;
  next_weekly_win: string | null;
  most_important_actions: Json;
  created_at: string;
}

export interface Milestone {
  id: string;
  user_id: string;
  domain_id: string | null;
  title: string;
  description: string | null;
  achieved_at: string;
  milestone_type: string;
}

export interface MomentumHistory {
  id: string;
  user_id: string;
  date: string;
  overall_score: number;
  money_score: number | null;
  body_score: number | null;
  home_score: number | null;
  capability_score: number | null;
}

export interface AiConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost: number | null;
  latency_ms: number | null;
  created_at: string;
}

export interface AiProposal {
  id: string;
  user_id: string;
  conversation_id: string | null;
  action_type: string;
  payload: Json;
  reasoning: string | null;
  status: "pending" | "approved" | "rejected" | "expired";
  created_at: string;
  resolved_at: string | null;
}

export interface Experiment {
  id: string;
  user_id: string;
  title: string;
  hypothesis: string | null;
  start_date: string;
  planned_end_date: string | null;
  status: "planned" | "active" | "completed" | "abandoned";
  target_metric: string | null;
  baseline_value: number | null;
  result_value: number | null;
  conclusion: string | null;
  decision: "keep" | "modify" | "abandon" | null;
  created_at: string;
  completed_at: string | null;
}

export interface Promise_ {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  committed_for: string;
  status: "active" | "kept" | "renegotiated" | "missed" | "cancelled";
  resolution_reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface FrictionEvent {
  id: string;
  user_id: string;
  task_id: string | null;
  reason: string;
  note: string | null;
  created_at: string;
}

export interface Idea {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  status: "parked" | "active" | "deleted";
  created_at: string;
  last_reviewed_at: string | null;
}

export interface StoppedItem {
  id: string;
  user_id: string;
  title: string;
  type: string;
  reason: string | null;
  stopped_at: string;
}

export interface Decision {
  id: string;
  user_id: string;
  title: string;
  context: string | null;
  decision: string;
  reasoning: string | null;
  confidence_pct: number | null;
  decided_at: string;
  review_date: string | null;
  outcome: string | null;
  outcome_rating: number | null;
}

export interface Evidence {
  id: string;
  user_id: string;
  domain_id: string | null;
  type: string;
  title: string;
  description: string | null;
  source_type: string | null;
  source_id: string | null;
  occurred_at: string;
  significance: number;
  metadata: Json;
}

export interface Competency {
  id: string;
  user_id: string;
  name: string;
  category: "engineering" | "professional";
  level: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CapabilityEvidence {
  id: string;
  user_id: string;
  competency_id: string | null;
  date: string;
  type: string;
  title: string;
  description: string | null;
  url: string | null;
  confidence: number | null;
  is_strong_evidence: boolean;
}

export interface GoogleConnection {
  id: string;
  user_id: string;
  google_user_id: string | null;
  email: string | null;
  refresh_token: string | null;
  token_encrypted: boolean;
  scope: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleTaskSync {
  id: string;
  task_id: string;
  google_task_id: string | null;
  google_tasklist_id: string | null;
  local_updated_at: string | null;
  google_updated_at: string | null;
  sync_status: "pending" | "synced" | "conflict" | "error";
  last_synced_at: string | null;
}
