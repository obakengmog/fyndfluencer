// types/database.ts
import { Timestamp } from 'firebase/firestore';

// ============================================================
// ENUMS & CONSTANTS
// ============================================================

export type UserType = 'brand' | 'agency' | 'influencer';
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type AuthProvider = 'email' | 'google' | 'facebook';

export type SubscriptionPlan =
    | 'free'
  | 'influencer_pro'
  | 'brand_monthly'
  | 'brand_annual'
  | 'agency_starter'
  | 'agency_pro'
  | 'agency_enterprise';

export type InfluencerTier = 'nano' | 'micro' | 'mid' | 'macro' | 'mega';
export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'twitter';
export type CampaignStatus = 'draft' | 'pending_approval' | 'active' | 'paused' | 'completed' | 'cancelled';
export type CampaignObjective = 'awareness' | 'engagement' | 'conversions' | 'sales';

// ============================================================
// USER
// ============================================================

export interface User {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
    userType: UserType;
    organizationId?: string;
    role?: UserRole;
    authProvider: AuthProvider;
    emailVerified?: boolean;
    isPersonalEmail?: boolean;
    onboardingCompleted: boolean;
    onboardingStep?: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastLoginAt: Timestamp;
}

// ============================================================
// ORGANIZATION (Brand or Agency)
// ============================================================

export interface Organization {
    id: string;
    type: 'brand' | 'agency';
    name: string;
    website?: string;
    logo?: string;
    industry?: string;
    onboardingData?: BrandOnboardingData | AgencyOnboardingData;
    ownerId: string;
    members: OrganizationMember[];
    subscriptionId?: string;
    clientBrandIds?: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface OrganizationMember {
    userId: string;
    email: string;
    displayName: string;
    role: UserRole;
    joinedAt: Timestamp;
    invitedBy: string;
}

// ============================================================
// SUBSCRIPTION (Multi-Seat)
// ============================================================

export interface Subscription {
    id: string;
    organizationId: string;
    plan: SubscriptionPlan;
    status: 'active' | 'cancelled' | 'past_due' | 'trialing';
    seats: {
      purchased: number;
      used: number;
      pricePerSeat: number;
    };
    billingCycle: 'monthly' | 'annual';
    currentPeriodStart: Timestamp;
    currentPeriodEnd: Timestamp;
    cancelAtPeriodEnd: boolean;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================================
// ONBOARDING DATA TYPES
// ============================================================

export interface BrandOnboardingData {
    companyName: string;
    website: string;
    logo?: string;
    industry: string;
    companySize: string;
    marketingGoals: string[];
    targetCountries: string[];
    targetAgeRange: [number, number];
    targetGender: 'all' | 'male' | 'female';
    targetInterests: string[];
    monthlyBudget: string;
    preferredPlatforms: SocialPlatform[];
    preferredInfluencerTiers: InfluencerTier[];
    completedAt?: Timestamp;
}

export interface AgencyOnboardingData {
    agencyName: string;
    website: string;
    logo?: string;
    servicesOffered: string[];
    industriesServed: string[];
    typicalClientSize: string;
    averageCampaignBudget: string;
    teamSize: number;
    seatsNeeded: number;
    completedAt?: Timestamp;
}

export interface InfluencerOnboardingData {
    displayName: string;
    bio: string;
    country: string;
    city?: string;
    languages: string[];
    connectedAccounts: {
      platform: SocialPlatform;
      handle: string;
      connected: boolean;
    }[];
    primaryNiche: string;
    secondaryNiches: string[];
    contentStyle: string[];
    currency: string;
    ratePost: number;
    rateStory: number;
    rateReel: number;
    rateVideo: number;
    portfolioItems: {
      url: string;
      type: 'image' | 'video';
      description?: string;
    }[];
    completedAt?: Timestamp;
}

// ============================================================
// INFLUENCER
// ============================================================

export interface Influencer {
    id: string;
    userId: string;
    profile: {
      displayName: string;
      bio: string;
      avatar?: string;
      coverImage?: string;
      country: string;
      city?: string;
      languages: string[];
      niches: string[];
    };
    socialAccounts: {
      instagram?: SocialAccount;
      tiktok?: SocialAccount;
      youtube?: SocialAccount;
      twitter?: SocialAccount;
    };
    metrics: {
      totalFollowers: number;
      averageEngagement: number;
      authenticityScore: number;
      tier: InfluencerTier;
      lastUpdated: Timestamp;
    };
    rateCard: {
      currency: string;
      post: number;
      story: number;
      reel: number;
      video: number;
    };
    verified: boolean;
    featured: boolean;
    searchableNiches: string[];
    searchableCountry: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface SocialAccount {
    platform: SocialPlatform;
    handle: string;
    profileUrl: string;
    followers: number;
    engagementRate: number;
    connected: boolean;
    accessToken?: string;
    lastVerified: Timestamp;
}

// ============================================================
// CAMPAIGN
// ============================================================

export interface Campaign {
    id: string;
    organizationId: string;
    createdBy: string;
    name: string;
    description: string;
    objective: CampaignObjective;
    status: CampaignStatus;
    dates: {
      created: Timestamp;
      start: Timestamp;
      end: Timestamp;
    };
    targetAudience: {
      countries: string[];
      ageRange: [number, number];
      gender: 'all' | 'male' | 'female';
      interests: string[];
    };
    budget: {
      total: number;
      currency: string;
      spent: number;
      escrowId?: string;
    };
    requirements: {
      platforms: SocialPlatform[];
      contentTypes: ('post' | 'story' | 'reel' | 'video')[];
      hashtags: string[];
      mentions: string[];
      guidelines: string;
      brandAssets?: string[];
    };
    performanceCriteria: {
      minEngagementRate?: number;
      minReach?: number;
      trackConversions: boolean;
    };
    aiMatching?: {
      enabled: boolean;
      lastRun: Timestamp;
      topMatches: string[];
    };
    influencerIds: string[];
    metrics: {
      totalReach: number;
      totalEngagement: number;
      averageEngagementRate: number;
      conversions: number;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================================
// ESCROW
// ============================================================

export interface Escrow {
    id: string;
    campaignId: string;
    organizationId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'funded' | 'partially_released' | 'released' | 'refunded' | 'disputed';
    releases: EscrowRelease[];
    stripePaymentIntentId?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface EscrowRelease {
    influencerId: string;
    amount: number;
    reason: string;
    releasedAt: Timestamp;
    releasedBy: string;
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export interface Notification {
    id: string;
    userId: string;
    type:
      | 'campaign_invite'
      | 'campaign_update'
      | 'payment_received'
      | 'team_invite'
      | 'deliverable_approved'
      | 'deliverable_rejected'
      | 'message';
    title: string;
    body: string;
    data?: Record<string, any>;
    read: boolean;
    createdAt: Timestamp;
}
