import {
  Bus,
  Car,
  Landmark,
  Moon,
  Plane,
  Route,
  Ship,
  ShoppingBag,
  Sparkles,
  TrainFront,
  TramFront,
  Utensils,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { IdeaKind, TravelMode } from "@/generated/prisma/enums";

export const TRAVEL_ICON: Record<TravelMode, LucideIcon> = {
  FLIGHT: Plane,
  SHINKANSEN: TrainFront,
  TRAIN: TramFront,
  BUS: Bus,
  FERRY: Ship,
  CAR: Car,
  OTHER: Route,
};

export const IDEA_ICON: Record<IdeaKind, LucideIcon> = {
  SIGHT: Landmark,
  FOOD: Utensils,
  SHOPPING: ShoppingBag,
  ONSEN: Waves,
  EXPERIENCE: Sparkles,
  NIGHTLIFE: Moon,
};

export const TRAVEL_COLOR = "#8e8e93";
