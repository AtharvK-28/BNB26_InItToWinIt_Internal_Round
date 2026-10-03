import {
  Baby,
  Camera,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  Landmark,
  Laptop,
  Leaf,
  MicVocal,
  Plane,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/types";

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  tech: Laptop,
  beauty: Sparkles,
  fitness: Dumbbell,
  gaming: Gamepad2,
  food: UtensilsCrossed,
  travel: Plane,
  finance: Landmark,
  fashion: Shirt,
  education: GraduationCap,
  wellness: Leaf,
  music: MicVocal,
  photography: Camera,
  parenting: Baby,
};

export function CategoryIcon({ c, className }: { c: Category; className?: string }) {
  const I = CATEGORY_ICONS[c];
  return <I className={className} strokeWidth={1.6} />;
}
