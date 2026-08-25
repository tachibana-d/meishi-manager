"use client";

import { v4 as uuidv4 } from "uuid";
import type { BusinessCard, BusinessCardInput } from "./types";

const STORAGE_KEY = "meishi_cards";

export function getCards(): BusinessCard[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getCard(id: string): BusinessCard | null {
  return getCards().find((c) => c.id === id) ?? null;
}

export function saveCard(input: BusinessCardInput): BusinessCard {
  const cards = getCards();
  const now = new Date().toISOString();
  const card: BusinessCard = {
    ...input,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  cards.unshift(card);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  return card;
}

export function updateCard(id: string, input: Partial<BusinessCardInput>): BusinessCard | null {
  const cards = getCards();
  const idx = cards.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const updated = { ...cards[idx], ...input, updatedAt: new Date().toISOString() };
  cards[idx] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  return updated;
}

export function deleteCard(id: string): void {
  const cards = getCards().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function getAllTags(): string[] {
  const cards = getCards();
  const tagSet = new Set<string>();
  cards.forEach((c) => c.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}
