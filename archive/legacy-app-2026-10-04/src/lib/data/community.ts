import type { CollabListing, ServiceListing } from "../types";

/* Fictional creators and freelancers. */

export const COLLABS: CollabListing[] = [
  { id: "c1", name: "Daniel Okafor", avatar: "pDaniel", cover: "gamingSetup", niche: "tech", platform: "youtube", followers: 1_120_000, lookingFor: "Budget vs. premium gear face-off", location: "London, UK", rating: 4.97, overlap: 0.34, badge: "Top collaborator" },
  { id: "c2", name: "Zara Malik", avatar: "pZara", cover: "uiDesign", niche: "tech", platform: "tiktok", followers: 640_000, lookingFor: "Swap desk setups for a week", location: "Toronto, CA", rating: 4.92, overlap: 0.41 },
  { id: "c3", name: "Leo Hartmann", avatar: "pLeo", cover: "laptopDesk", niche: "education", platform: "linkedin", followers: 88_000, lookingFor: "Creator-business podcast guest", location: "Berlin, DE", rating: 4.88, overlap: 0.18, badge: "New" },
  { id: "c4", name: "Nadia Haddad", avatar: "pNadia", cover: "studyGroup", niche: "education", platform: "youtube", followers: 390_000, lookingFor: "Study-with-me livestream", location: "Dubai, AE", rating: 4.95, overlap: 0.22 },
  { id: "c5", name: "Kai Nakamura", avatar: "pKai", cover: "photographerPeak", niche: "photography", platform: "instagram", followers: 270_000, lookingFor: "Camera-gear road trip series", location: "Portland, US", rating: 4.9, overlap: 0.15 },
  { id: "c6", name: "Eli Brooks", avatar: "pEli", cover: "controllerNeon", niche: "gaming", platform: "twitch", followers: 300_000, lookingFor: "Streaming-setup build together", location: "Austin, US", rating: 4.86, overlap: 0.27, badge: "Near you" },
  { id: "c7", name: "Rosa Jiménez", avatar: "pRosa", cover: "meditation", niche: "wellness", platform: "instagram", followers: 88_000, lookingFor: "Creator burnout — honest conversation", location: "Madrid, ES", rating: 4.98, overlap: 0.12 },
  { id: "c8", name: "Omar Siddiqui", avatar: "pOmar", cover: "stockChart", niche: "finance", platform: "youtube", followers: 520_000, lookingFor: "How much creators really earn", location: "Chicago, US", rating: 4.91, overlap: 0.19 },
];

export const SERVICES: ServiceListing[] = [
  { id: "s1", name: "Isla Chen", avatar: "pIsla", cover: "videoEdit", service: "YouTube video editing", price: 350, unit: "per video", rating: 4.98, reviews: 212, turnaround: "3-day delivery", badge: "Top rated" },
  { id: "s2", name: "Marcus Bell", avatar: "pMarcus", cover: "uiDesign", service: "Thumbnail design (3 concepts)", price: 120, unit: "per thumbnail", rating: 4.95, reviews: 540, turnaround: "24-hour delivery" },
  { id: "s3", name: "Grace Owusu", avatar: "pGrace", cover: "meetingLaptops", service: "Talent management", price: 15, unit: "% of deals", rating: 4.9, reviews: 64, turnaround: "Ongoing", badge: "Verified" },
  { id: "s4", name: "Dev Patel", avatar: "pDev", cover: "codeScreen", service: "Short-form clipping", price: 45, unit: "per clip", rating: 4.93, reviews: 380, turnaround: "48-hour delivery" },
  { id: "s5", name: "Chloe Dubois", avatar: "pChloe", cover: "pinkWall", service: "Brand-safe contract review", price: 180, unit: "per contract", rating: 4.97, reviews: 129, turnaround: "2-day delivery" },
  { id: "s6", name: "Andre Lewis", avatar: "pAndre", cover: "studioMic", service: "Podcast audio mastering", price: 90, unit: "per episode", rating: 4.89, reviews: 98, turnaround: "2-day delivery" },
  { id: "s7", name: "June Park", avatar: "pJune", cover: "cameraLenses", service: "Product photography", price: 400, unit: "per shoot", rating: 4.96, reviews: 77, turnaround: "1-week delivery", badge: "New" },
  { id: "s8", name: "Sam Rivera", avatar: "pSam", cover: "taxDesk", service: "Creator bookkeeping", price: 199, unit: "per month", rating: 4.92, reviews: 156, turnaround: "Monthly" },
];
