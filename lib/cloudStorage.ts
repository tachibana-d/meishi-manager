import type { BusinessCard, BusinessCardInput } from "./types";
import { supabase } from "./supabase";
import { getCards } from "./storage";

function requireClient() {
  if (!supabase) throw new Error("Supabaseの環境変数が設定されていません");
  return supabase;
}

export async function getCurrentUser() {
  const client = requireClient();
  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function getCloudCards(): Promise<BusinessCard[]> {
  const client = requireClient();
  const { data, error } = await client.from("business_cards").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.data as BusinessCard);
}

export async function migrateLocalCards() {
  const client = requireClient();
  const user = await getCurrentUser();
  if (!user) return;
  const localCards = getCards();
  if (localCards.length === 0) return;
  const { data: existing } = await client.from("business_cards").select("id");
  const existingIds = new Set((existing ?? []).map((row) => row.id));
  const pending = localCards
    .filter((card) => !existingIds.has(card.id))
    .map((card) => ({ id: card.id, user_id: user.id, data: card, created_at: card.createdAt, updated_at: card.updatedAt }));
  if (pending.length > 0) await client.from("business_cards").insert(pending);
}

export async function getCloudCard(id: string): Promise<BusinessCard | null> {
  const client = requireClient();
  const { data, error } = await client.from("business_cards").select("data").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data?.data as BusinessCard | undefined) ?? null;
}

export async function saveCloudCard(input: BusinessCardInput): Promise<BusinessCard> {
  const client = requireClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です");
  const now = new Date().toISOString();
  const card = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  const { error } = await client.from("business_cards").insert({ id: card.id, user_id: user.id, data: card });
  if (error) throw error;
  return card;
}

export async function updateCloudCard(id: string, input: BusinessCardInput): Promise<BusinessCard> {
  const client = requireClient();
  const current = await getCloudCard(id);
  if (!current) throw new Error("名刺が見つかりません");
  const card = { ...current, ...input, id, updatedAt: new Date().toISOString() };
  const { error } = await client.from("business_cards").update({ data: card, updated_at: card.updatedAt }).eq("id", id);
  if (error) throw error;
  return card;
}

export async function deleteCloudCard(id: string) {
  const client = requireClient();
  const { error } = await client.from("business_cards").delete().eq("id", id);
  if (error) throw error;
}
