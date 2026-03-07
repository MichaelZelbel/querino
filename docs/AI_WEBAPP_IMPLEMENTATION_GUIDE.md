# AI-Powered Web App Foundation Implementation Guide

This document provides step-by-step prompts to build a complete AI-powered multi-user web application foundation using Lovable. Copy each prompt in sequence to create a production-ready starter that can be extended for specific use cases like:

- AI-powered 2nd Brain / Knowledge Management
- AI-powered Social Media Creator
- AI-powered Content Writing Platform
- AI-powered Research Assistant
- Any AI-enhanced productivity tool

This is the **open-source / self-hosted** variant of the guide. It includes full multi-user support, role-based subscriptions, premium feature gating, and AI token tracking — but without Stripe billing or a pricing page. Roles and subscription tiers are managed by admins. Ideal for internal tools, community projects, or open-source products where monetisation is handled externally or not needed.

---

## Overview

This guide creates a web app foundation with:

- **Authentication**: Email/password + OAuth (Google, GitHub)
- **User Management**: Profiles, avatars, account deletion
- **Role & Subscription System**: Free, premium, premium_gift, and admin roles (assigned by admins, no payment flow)
- **Admin Dashboard**: User management, role assignment, AI credit management
- **AI Credits System**: Token-based AI usage tracking with monthly allowances based on subscription tier
- **Subscription UI**: Premium gating, plan display, and role-based feature access
- **Core Pages**: Landing, Dashboard, Docs, Legal pages
- **Design System**: Professional, themeable UI with dark mode

---

## Prerequisites

Before starting, ensure your Lovable project has:
- Supabase connected (Cloud or external)
- A fresh project (or willingness to adapt existing code)

---

## ToDo
1.
Add this: https://querino.ai/prompts/admin-notification-email-vibe-coding

2. Add something like this:
Add a success state to the signup form with a clear confirmation message.

When a new user signs up and submits their email address, then there is only a little toast message telling them to check their email. The screen simply stays on the form with the entry boxes just like something was wrong.


## Phase 1: Foundation & Design System

### Prompt 1.1: Initialize Design System

```
Set up a professional design system for a web application with:

1. Color palette using CSS custom properties in index.css:
   - Primary: A bold, professional blue or your brand color
   - Secondary: Complementary accent color
   - Semantic colors: success, warning, error, info
   - Neutral grays for backgrounds and text
   - Both light and dark mode variants

2. Typography scale:
   - Use a modern sans-serif font pairing (e.g., Inter for body, plus a display font)
   - Define heading sizes (h1-h6) with proper line heights
   - Body text sizes (sm, base, lg)

3. Spacing and layout tokens:
   - Consistent spacing scale (4, 8, 12, 16, 24, 32, 48, 64, 96)
   - Container max-widths
   - Border radius scale

4. Component foundations:
   - Button variants: primary, secondary, outline, ghost, destructive
   - Card styles with subtle shadows
   - Form input styles
   - Badge variants

Use shadcn/ui components as the base. All colors must use HSL format.
The design should feel modern, clean, and trustworthy.
```

### Prompt 1.2: Create Layout Components

```
Create the core layout components:

1. Header component (src/components/layout/Header.tsx):
   - Logo on the left (placeholder for now)
   - Navigation links in the center (Home, Features, Docs)
   - Right side:
     - If logged out: "Sign In" and "Get Started" buttons
     - If logged in: User avatar dropdown with Dashboard, Settings, Sign Out
   - Mobile responsive with hamburger menu
   - Sticky header with subtle backdrop blur on scroll

2. Footer component (src/components/layout/Footer.tsx):
   - Multi-column layout with:
     - Product links (Features, Docs)
     - Company links (About, Blog, Careers)
     - Legal links (Privacy, Terms, Cookies)
     - Social media icons (placeholder)
   - Copyright notice with current year
   - Newsletter signup form (UI only for now)

3. PageLayout component that wraps pages with Header and Footer

4. DashboardLayout component for authenticated pages:
   - Sidebar navigation
   - Main content area
   - Collapsible on mobile

Use React Router for navigation. Make sure all links work correctly.
```

---

## Phase 2: Authentication System

### Prompt 2.1: Database Schema for Users

```
Create the database schema for user management:

1. Create a `profiles` table:
   - id (uuid, primary key, references auth.users)
   - display_name (text)
   - avatar_url (text)
   - bio (text, nullable)
   - website (text, nullable)
   - created_at (timestamptz)
   - updated_at (timestamptz)

   RLS policies:
   - Users can view their own profile
   - Users can update their own profile
   - Public profiles are viewable by everyone (for future social features)

2. Create a `user_roles` table:
   - id (uuid, primary key)
   - user_id (uuid, unique, references auth.users)
   - role (enum: 'free', 'premium', 'premium_gift', 'admin')
   - created_at (timestamptz)

   RLS policies:
   - Users can view their own role
   - Only admins can update roles

3. Create database functions:
   - get_user_role(user_id): Returns the user's role
   - is_admin(user_id): Returns true if user is admin
   - is_premium_user(user_id): Returns true if user has premium access (premium, premium_gift, or admin)
   - has_role(user_id, role): Checks if user has specific role

4. Create triggers:
   - Auto-create profile on user signup
   - Auto-assign 'free' role on user signup
   - Auto-update updated_at on profile changes

Make sure all functions use SECURITY DEFINER to bypass RLS for internal checks.
```

### Prompt 2.2: Authentication Pages

```
Create the authentication system:

1. Auth page (src/pages/Auth.tsx) at route /auth:
   - Tabbed interface: "Sign In" and "Sign Up"
   - Sign In form:
     - Email input with validation
     - Password input
     - "Forgot password?" link
     - Submit button with loading state
     - OAuth buttons: "Continue with Google", "Continue with GitHub"
     - Divider: "or continue with email"
   - Sign Up form:
     - Display name input
     - Email input with validation
     - Password input with strength indicator
     - Confirm password input
     - Terms acceptance checkbox
     - Submit button
     - OAuth buttons
   - Beautiful, centered card layout
   - Redirect to /dashboard after successful auth
   - Handle ?redirect query param to return user to original page

2. AuthContext (src/contexts/AuthContext.tsx):
   - Provide user, session, loading state
   - Sign in, sign up, sign out functions
   - OAuth sign in functions
   - Listen to auth state changes
   - Fetch user profile and role on auth

3. Protected route wrapper component:
   - Redirect to /auth if not authenticated
   - Show loading spinner while checking auth
   - Pass ?redirect param to return after login

4. useAuth hook for easy access to auth context

Handle all error cases with user-friendly toast messages.
Use Supabase Auth for the backend.
```

### Prompt 2.3: Profile Management

```
Create profile management functionality:

1. Settings page (src/pages/Settings.tsx) at route /settings:
   - Tabbed layout with sections:
     - Profile: Display name, bio, website
     - Avatar: Upload/change profile picture
     - Account: Email, password change
     - Subscription: Current plan details
     - Danger Zone: Delete account

2. Profile tab:
   - Avatar preview (circular, with edit overlay on hover)
   - Display name input
   - Bio textarea (max 160 chars)
   - Website URL input
   - Save button with loading state

3. Avatar upload:
   - Click avatar to open file picker
   - Accept only images (jpg, png, gif, webp)
   - Max file size: 2MB
   - Upload to Supabase Storage 'avatars' bucket
   - Show upload progress
   - Update profile with new URL
   - Delete old avatar on replace

4. Account tab:
   - Current email (read-only for now)
   - Change password section:
     - Current password
     - New password with strength indicator
     - Confirm new password
     - Update button

5. Danger Zone tab (styled with red/warning colors):
   - "Delete Account" section with clear warning
   - Require password confirmation
   - Show what will be deleted
   - Confirmation dialog with typed confirmation
   - Call delete account edge function

Create the storage bucket for avatars if it doesn't exist.
Create a delete-my-account edge function that:
- Verifies the user's password
- Deletes all user data (profile, roles, etc.)
- Deletes the auth user
- Returns success/error response
```

---

## Phase 3: Landing & Marketing Pages

### Prompt 3.1: Landing Page

```
Create a compelling landing page at the root route (/):

1. Hero Section:
   - Large, attention-grabbing headline (placeholder: "Build Amazing Things with AI")
   - Subheadline explaining the value proposition
   - CTA buttons: "Get Started Free" and "See How It Works"
   - Hero image or illustration placeholder
   - Subtle animated gradient background or pattern

2. Features Section:
   - 3-column grid on desktop, stack on mobile
   - Each feature card:
     - Icon
     - Title
     - Description
   - Use placeholder features like:
     - "AI-Powered Insights"
     - "Seamless Collaboration"
     - "Open Source & Self-Hosted"
     - "Integrations"
     - "Analytics Dashboard"
     - "Community Driven"

3. How It Works Section:
   - 3-step process with numbered steps
   - Each step: icon, title, description
   - Visual connection between steps

4. Social Proof Section:
   - Community testimonials carousel (placeholder content)
   - Logo cloud of "trusted by" organisations (placeholder)

5. Final CTA Section:
   - "Ready to get started?"
   - Large CTA button
   - Background gradient

Use framer-motion for subtle scroll animations.
The page should feel premium and inspire confidence.
```

### Prompt 3.2: Legal Pages

```
Create all required legal pages:

1. Privacy Policy (/privacy):
   - Professional layout with table of contents
   - Sections:
     - Information We Collect
     - How We Use Your Information
     - Data Storage and Security
     - Third-Party Services (mention Supabase, analytics)
     - Your Rights (GDPR, CCPA)
     - Cookies
     - Contact Information
   - Last updated date
   - Use placeholder company name "[Project Name]"

2. Terms of Service (/terms):
   - Sections:
     - Acceptance of Terms
     - Description of Service
     - User Accounts
     - Acceptable Use Policy
     - Intellectual Property
     - Limitation of Liability
     - Termination
     - Changes to Terms
     - Governing Law
   - Last updated date

3. Cookie Policy (/cookies):
   - What are cookies
   - Types of cookies we use (essential, analytics, preferences)
   - How to manage cookies
   - Third-party cookies

4. Impressum (/impressum) for EU compliance:
   - Company information placeholders
   - Contact details
   - Registration information
   - VAT number placeholder

5. Cookie Consent Banner:
   - Fixed bottom banner
   - Brief explanation
   - "Accept All", "Reject Non-Essential", "Customize" buttons
   - Remember choice in localStorage
   - Don't show again if already accepted

All pages should:
- Have a clean, readable layout
- Include a sidebar table of contents on desktop
- Be easy to scan with clear headings
- Include "Last Updated" dates
```

### Prompt 3.3: Documentation Page

```
Create a documentation page at /docs:

1. Layout:
   - Left sidebar with navigation (collapsible on mobile)
   - Main content area
   - Right sidebar with "On this page" links (table of contents)

2. Documentation Structure:

   Getting Started:
   - Quick Start Guide
   - Creating Your Account
   - Dashboard Overview

   Features:
   - [Feature 1 placeholder]
   - [Feature 2 placeholder]
   - [Feature 3 placeholder]

   Account:
   - Profile Settings
   - Team Members (placeholder)

   API Reference (placeholder):
   - Authentication
   - Endpoints
   - Rate Limits

   FAQ:
   - Common questions

3. Documentation Features:
   - Search functionality (search through doc content)
   - Code blocks with syntax highlighting
   - Callout boxes (info, warning, tip)
   - Copy button for code snippets
   - Previous/Next navigation at bottom
   - "Was this helpful?" feedback buttons

4. Content Storage:
   - Store docs content in src/content/docs/ as markdown or TSX components
   - Easy to update and extend

For now, create the structure with placeholder content.
The actual documentation will be filled in as features are built.
```

---

## Phase 4: Dashboard & Core App

### Prompt 4.1: Dashboard Page

```
Create the main dashboard at /dashboard:

1. Dashboard Layout:
   - Use DashboardLayout with sidebar
   - Welcome message with user's name
   - Quick action buttons

2. Dashboard Widgets:

   Stats Overview Cards (top row):
   - Total items count (placeholder)
   - AI credits remaining
   - Recent activity count
   - Role badge showing current user role

   Recent Activity Widget:
   - List of recent actions
   - "View All" link
   - Empty state if no activity

   Quick Actions Widget:
   - "Create New [Item]" button
   - "Import" button
   - "View Library" button

   Getting Started Checklist (for new users):
   - Complete profile
   - Create first item
   - Explore features
   - Invite team (premium)
   - Dismiss option

3. Dashboard Sidebar Navigation:
   - Dashboard (home icon)
   - Library (folder icon)
   - Discover (search icon)
   - Collections (bookmark icon)
   - Team (users icon) - premium only
   - Settings (gear icon)

4. Empty State:
   - Friendly illustration
   - "Get started by creating your first item"
   - CTA button

The dashboard should feel productive and not overwhelming.
Show/hide premium features based on user role.
```

### Prompt 4.2: Onboarding Wizard

```
Create an onboarding wizard at /wizard:

1. Multi-step wizard flow:
   - Step indicator showing progress
   - Back/Next navigation
   - Skip option
   - Animated transitions between steps

2. Step 1 - Welcome:
   - Welcome message with user's name
   - Brief explanation of what the app does
   - "Let's get started" button

3. Step 2 - Complete Profile:
   - Avatar upload
   - Display name (pre-filled if set)
   - Bio (optional)
   - Skip option

4. Step 3 - Choose Your Focus:
   - What will you primarily use this for?
   - Multiple choice options (use cases)
   - This helps personalize the experience
   - Store preference in user profile or localStorage

5. Step 4 - Tour Highlights:
   - Quick visual tour of main features
   - 3-4 key features with icons and descriptions
   - "Explore on your own" or "Take guided tour" options

6. Step 5 - Ready to Go:
   - Celebration animation/confetti
   - "Go to Dashboard" button
   - Helpful resources links

7. Wizard State:
   - Track completion in localStorage or profile
   - Only show to new users
   - Allow skipping entirely
   - "Don't show again" option

8. After completion:
   - Redirect to dashboard
   - Mark wizard as completed

The wizard should feel welcoming, not tedious.
Make each step quick to complete or skip.
```

### Prompt 4.3: User Library Page

```
Create a library page at /library for managing user's items:

1. Page Layout:
   - Page title "My Library"
   - Tabs: "All", "Recent", "Favorites" (placeholder for future)
   - Search bar
   - Filter dropdown (category, date, etc.)
   - View toggle: Grid/List
   - "Create New" button

2. Item Cards (placeholder for actual content):
   - Grid layout (responsive: 1-2-3-4 columns)
   - Each card shows:
     - Title
     - Description preview
     - Category badge
     - Created date
     - Quick actions: Edit, Delete, Favorite
   - Hover effect

3. Empty State:
   - Illustration
   - "Your library is empty"
   - "Create your first item" CTA

4. Search & Filter:
   - Real-time search (debounced)
   - Category filter
   - Sort by: Recent, Alphabetical, Most Used
   - Clear filters button

5. Pagination or Infinite Scroll:
   - Load more button or infinite scroll
   - Loading skeletons

6. Item Actions:
   - Click to view detail
   - Edit button
   - Delete with confirmation
   - Duplicate (premium)
   - Move to collection

For now, create the UI structure with placeholder/mock data.
The actual data fetching will depend on the specific implementation.
```

---

## Phase 5: AI Credits System

### Prompt 5.1: AI Credits Database Schema

```
Create the AI credits system database schema:

1. Create `ai_credit_settings` table:
   - key (text, primary key)
   - value_int (integer, not null)
   - description (text, nullable)

   Insert default settings:
   - tokens_per_credit: 200
   - credits_free_per_month: 0
   - credits_premium_per_month: 1500

   RLS: Anyone can SELECT, only admins can UPDATE

2. Create `ai_allowance_periods` table:
   - id (uuid, primary key)
   - user_id (uuid, not null)
   - tokens_granted (bigint, default 0)
   - tokens_used (bigint, default 0)
   - period_start (timestamptz)
   - period_end (timestamptz)
   - source (text: 'role_based', 'free_tier', 'admin_grant')
   - metadata (jsonb: { rollover_tokens, base_tokens })
   - created_at, updated_at

   RLS: Users view own, admins view/insert/update all

3. Create `llm_usage_events` table (audit log):
   - id (uuid, primary key)
   - user_id (uuid, not null)
   - idempotency_key (text, unique)
   - feature (text: 'ai_feature_1', 'ai_feature_2', etc.)
   - model, provider (text)
   - prompt_tokens, completion_tokens, total_tokens (bigint)
   - credits_charged (numeric)
   - metadata (jsonb)
   - created_at

   RLS: Users can only SELECT their own events

4. Create view `v_ai_allowance_current`:
   - Joins allowance periods with settings
   - Calculates: remaining_tokens, credits_granted, credits_used, remaining_credits
   - Filters to current period

5. Create trigger to auto-calculate total_tokens on insert
```

### Prompt 5.2: AI Credits Edge Function

```
Create the ensure-token-allowance Edge Function:

1. Accepts optional JSON body:
   - user_id (optional, defaults to authenticated user)
   - batch_init (boolean for cron job)

2. Authorization:
   - If user_id differs from caller, require admin
   - For batch_init, require admin or service role

3. Single user logic:
   - Check for current allowance period
   - If exists, return it
   - If not, create new period:
     a. Calculate period dates (1st of month to 1st of next month)
     b. Get user's role to determine credits
     c. Look up credits_per_month from settings based on role
     d. Calculate base_tokens = credits x tokens_per_credit
     e. Calculate rollover from previous period (capped at base)
     f. Insert new period with tokens_granted = base + rollover
     g. Store metadata with breakdown

4. For batch_init:
   - Query all user_ids from profiles
   - Create periods for users without current period
   - Return count of initialized users

5. Return the allowance period data

Use SUPABASE_SERVICE_ROLE_KEY for database operations.
Set verify_jwt = false in config.toml for service access.
```

### Prompt 5.3: AI Credits Frontend

```
Create the frontend components for AI credits:

1. useAICredits hook (src/hooks/useAICredits.ts):
   - On mount: call ensure-token-allowance, then fetch from v_ai_allowance_current
   - Return: credits object, isLoading, error, refetch
   - Credits object includes:
     - tokensGranted, tokensUsed, remainingTokens
     - creditsGranted, creditsUsed, remainingCredits
     - periodStart, periodEnd
     - rolloverTokens, baseTokens
     - tokensPerCredit
   - Show low credit warning toast (once per session, when < 15%)

2. useAICreditsGate hook:
   - Uses useAICredits internally
   - Provides checkCredits() function:
     - Returns true if credits > 0
     - Returns false and shows toast if no credits
     - Returns true while loading (fail-open)
   - Use before any AI API calls

3. CreditsDisplay component (src/components/settings/CreditsDisplay.tsx):
   - Shows "AI Credits remaining: X of Y"
   - Progress bar with rollover section highlighted
   - Rollover preview when near period end
   - Info about reset date
   - Loading spinner while fetching

4. Add CreditsDisplay to:
   - Settings page (new "AI Credits" tab)
   - Dashboard sidebar

5. Add credits check to AI features:
   - Before calling AI, check credits with useAICreditsGate
   - After successful AI call, refetch credits
   - Show "contact admin" prompt if out of credits
```

### Prompt 5.4: Subscription UI Integration

```
Integrate subscription/role status throughout the app.
Roles are assigned by admins — there is no in-app purchase flow, no upsell modals,
and no upgrade buttons. The UI simply reflects the user's current plan and gates
features accordingly.

1. Create useSubscription hook (src/hooks/useSubscription.ts):
   - Fetch user role on mount from AuthContext or user_roles table
   - Provide: role, isSubscribed (premium/premium_gift/admin), isLoading
   - is_premium_user DB function determines premium access

2. Create PremiumGate component:
   - Wraps premium-only features
   - If user is premium: render children normally
   - If user is free: render a clean "Premium Feature" notice
     explaining this feature requires a premium role,
     and to contact an administrator for access
   - No purchase buttons, no upsell language

3. Create PremiumBadge component:
   - Small badge/icon shown next to premium-only features in navigation and UI
   - Helps users understand which features are role-gated
   - Shown regardless of current role (informational, not promotional)

4. Update Settings page — Subscription tab:
   - Show current plan/role with a clear badge (Free / Premium / Admin)
   - Show AI credits summary (link to AI Credits tab for details)
   - If premium: show that the plan is active and managed by an administrator
   - If free: show a note that premium access can be granted by an administrator
   - No "Upgrade" or "Manage Subscription" buttons

5. Update Dashboard:
   - Show current role badge in sidebar or header area
   - Show premium badge next to premium-gated sidebar items
   - AI credits widget reflects allowance based on current role

6. Update Header:
   - Show role badge for premium/admin users in the user menu
   - No upgrade prompts

Show/hide premium features cleanly based on role.
The experience should feel informative, not restrictive or sales-driven.
```

---

## Phase 6: Admin Dashboard

### Prompt 6.1: Admin Page

```
Create an admin dashboard at /admin:

1. Access Control:
   - Only accessible by users with 'admin' role
   - Redirect to /dashboard if not admin
   - Show "Access Denied" message with redirect

2. Admin Layout:
   - Same sidebar as dashboard
   - Admin-specific navigation items
   - Visual indicator that this is admin area

3. Admin Overview Tab:
   - Total users count
   - Premium users count
   - New users this week
   - AI credit usage metrics
   - Quick charts (placeholder)

4. User Management Tab:
   - Table of all users:
     - Avatar, Name, Email
     - Role badge
     - Joined date
     - Actions column
   - Search users by name/email
   - Filter by role
   - Pagination

5. User Actions:
   - View user details
   - Change user role (dropdown: free, premium, premium_gift, admin)
   - Manage AI credits (open modal)
   - Delete user (with confirmation)

6. AI Credit Settings Tab:
   - List all ai_credit_settings rows
   - Editable inline inputs
   - Save changes button
   - Explanation of each setting

7. User Token Modal:
   - Opens when admin clicks credits icon
   - Shows current period details
   - Editable fields: tokens_granted, tokens_used
   - Auto-calculates remaining and credit equivalents
   - Save button logs change to llm_usage_events

8. System Settings Tab (placeholder):
   - Feature flags
   - Maintenance mode toggle
   - Cache clear button

All admin actions should be logged.
Use proper authorization checks on all operations.
```

---

## Phase 7: Activity & Notifications

### Prompt 7.1: Activity Logging System

```
Create an activity logging system:

1. Create `activity_events` table:
   - id (uuid, primary key)
   - actor_id (uuid, references profiles)
   - action (text: 'create', 'update', 'delete', 'login', etc.)
   - item_type (text: 'item', 'profile', 'team', etc.)
   - item_id (uuid, nullable)
   - metadata (jsonb for additional context)
   - created_at (timestamptz)

   RLS:
   - Users can view their own events
   - Users can create events where they are the actor
   - Admins can view all events

2. useLogActivity hook:
   - Provides logActivity(action, itemType, itemId, metadata) function
   - Automatically includes current user as actor
   - Queue events and batch insert for performance

3. Activity Feed Component:
   - List of recent activity
   - Each item shows: icon, action description, timestamp
   - "View all" link to full activity page

4. Activity Page (/activity):
   - Full activity history for user
   - Filter by action type
   - Date range filter
   - Infinite scroll

5. Activity integration:
   - Log on item create/update/delete
   - Log on profile update
   - Log on login (via trigger or edge function)
   - Log on role change

The activity log helps users track their actions and admins monitor usage.
```

---

## Phase 8: Additional Features

### Prompt 8.1: Dark Mode Toggle

```
Implement dark mode support:

1. ThemeProvider setup:
   - Use next-themes or custom implementation
   - Detect system preference
   - Persist preference in localStorage

2. Theme toggle component:
   - Sun/Moon icons
   - Smooth transition
   - Place in header user menu

3. Update all components:
   - Ensure proper color token usage
   - Test all pages in both modes
   - Check contrast ratios

4. CSS custom properties:
   - Define :root (light) and .dark (dark) variants
   - All colors use HSL format
   - Smooth transition on theme change
```

### Prompt 8.2: Toast Notifications

```
Set up a toast notification system:

1. Use sonner (already installed) or similar

2. Configure toast container:
   - Position: top-right
   - Auto-dismiss: 5 seconds
   - Stack limit: 3

3. Toast variants:
   - Success (green)
   - Error (red)
   - Warning (yellow)
   - Info (blue)
   - Loading (with spinner)

4. Create useToast convenience hook if not exists

5. Standard toast messages:
   - "Changes saved successfully"
   - "Failed to save changes. Please try again."
   - "Please sign in to continue"
   - "Copied to clipboard"
   - etc.
```

### Prompt 8.3: Error Boundaries and 404

```
Create error handling components:

1. NotFound page (/404 and catch-all):
   - Friendly illustration
   - "Page not found" message
   - "Go to Dashboard" and "Go Home" buttons
   - Search box to find what they were looking for

2. ErrorBoundary component:
   - Catches React errors
   - Shows friendly error message
   - "Try Again" button
   - Option to report error
   - Log error to console/service

3. API Error Handler:
   - Consistent error response format
   - User-friendly error messages
   - Retry logic for transient errors

4. Loading States:
   - Skeleton components for cards, tables, text
   - Full-page loading spinner
   - Inline loading indicators
```

---

## Phase 9: Final Polish

### Prompt 9.1: SEO and Meta Tags

```
Implement SEO best practices:

1. Update index.html:
   - Proper title tag structure
   - Meta description
   - Open Graph tags
   - Twitter Card tags
   - Favicon setup
   - IMPORTANT: Do NOT put a hardcoded <link rel="canonical"> in index.html.
     In an SPA, every route serves the same index.html, so a hardcoded canonical
     tells Google that every page is a duplicate of whatever URL you hardcode.
     This causes the Google Search Console error:
     "Alternate page with proper canonical tag" -- and Google will skip indexing
     all pages except the one in the canonical.

2. Create SEOHead component for dynamic pages:
   - Updates document title
   - Sets meta description, OG tags, Twitter Card tags
   - ALWAYS sets a canonical URL:
     - If an explicit canonicalUrl prop is provided, use it
     - Otherwise, default to: window.location.origin + window.location.pathname
     - This strips query parameters (e.g. ?page=2) to avoid duplicate canonicals
     - Every page must declare itself as canonical, not rely on index.html
   - Structured data (JSON-LD) where applicable

3. Use SEOHead on every page:
   - Home: Main pitch keywords
   - Docs: Documentation keywords
   - Dashboard: "Dashboard - [App Name]" (with noIndex for private pages)
   - Blog pages: Pass explicit canonicalUrl with the full post URL

4. Robots.txt:
   - Allow all public pages
   - Disallow /dashboard, /admin, /settings

5. Sitemap generation (placeholder):
   - List all public routes
   - Update on content changes

KEY LESSON: In a Single Page Application, Google reads the raw HTML *before*
JavaScript executes. Any SEO-critical tags in index.html apply to ALL routes.
The only safe approach is to manage canonical tags dynamically via a component
like SEOHead that runs on each route change.
```

### Prompt 9.2: Performance Optimization

```
Optimize application performance:

1. Code splitting:
   - Lazy load routes with React.lazy
   - Suspense boundaries with loading fallbacks
   - Split large components

2. Image optimization:
   - Use proper image formats
   - Lazy load images below fold
   - Placeholder/blur while loading

3. Bundle optimization:
   - Analyze bundle size
   - Remove unused dependencies
   - Tree shaking verification

4. Caching:
   - Cache API responses where appropriate
   - Use React Query for data fetching
   - Implement stale-while-revalidate

5. Loading states:
   - Skeleton loaders
   - Optimistic updates
   - Progressive loading
```

### Prompt 9.3: Mobile Responsiveness

```
Ensure full mobile responsiveness:

1. Test and fix all pages on mobile:
   - Landing page
   - Auth pages
   - Dashboard
   - Settings
   - All modals and dialogs

2. Mobile-specific improvements:
   - Touch-friendly buttons (min 44px)
   - Proper spacing
   - Collapsible navigation
   - Swipe gestures where appropriate

3. Responsive breakpoints:
   - Mobile: < 640px
   - Tablet: 640px - 1024px
   - Desktop: > 1024px

4. Test on actual devices or emulators
```

---

## Architecture Summary

```
+-----------------------------------------------------------------+
|                        FRONTEND                                 |
+-----------------------------------------------------------------+
|  Pages:                                                         |
|  - Landing, Auth, Dashboard, Library, Settings                  |
|  - Docs, Legal pages                                            |
|  - Admin, Activity, Wizard                                      |
|                                                                 |
|  Components:                                                    |
|  - Layout: Header, Footer, Sidebar                              |
|  - UI: Cards, Modals, Forms                                     |
|  - Premium: PremiumGate, PremiumBadge (role-based)               |
|                                                                 |
|  Hooks:                                                         |
|  - useAuth, useSubscription, useAICredits, useAICreditsGate     |
|  - useLogActivity, useToast                                     |
+-----------------------------------------------------------------+
                               |
                               v
+-----------------------------------------------------------------+
|                     EDGE FUNCTIONS                               |
+-----------------------------------------------------------------+
|  Auth & Users:                                                  |
|  - delete-my-account                                            |
|                                                                 |
|  AI Credits:                                                    |
|  - ensure-token-allowance                                       |
+-----------------------------------------------------------------+
                               |
                               v
+-----------------------------------------------------------------+
|                        DATABASE                                  |
+-----------------------------------------------------------------+
|  Core Tables:                                                   |
|  - profiles (user data)                                         |
|  - user_roles (permissions)                                     |
|  - activity_events (audit log)                                  |
|                                                                 |
|  AI Credits:                                                    |
|  - ai_credit_settings                                           |
|  - ai_allowance_periods                                         |
|  - llm_usage_events                                             |
|                                                                 |
|  Views:                                                         |
|  - v_ai_allowance_current                                       |
|                                                                 |
|  Functions:                                                     |
|  - get_user_role, is_admin, is_premium_user                     |
+-----------------------------------------------------------------+
                               |
                               v
+-----------------------------------------------------------------+
|                     EXTERNAL SERVICES                            |
+-----------------------------------------------------------------+
|  Supabase Storage: Avatar uploads                               |
|  AI Provider: [Your choice - OpenAI, Anthropic, etc.]           |
+-----------------------------------------------------------------+
```

---

## Customization Points

After completing this foundation, extend for your specific app:

1. **Define Your Core Entity**: Replace placeholder "items" with your actual data model
   - 2nd Brain: Notes, Documents, Connections
   - Social Media: Posts, Campaigns, Accounts
   - Content Platform: Articles, Templates, Projects

2. **Add AI Features**: Integrate your AI capabilities
   - Use the AI credits system for tracking
   - Create edge functions for AI operations
   - Build UI for AI interactions

3. **Team/Collaboration**: Add team features if needed
   - Teams table
   - Team members with roles
   - Shared resources

4. **Integrations**: Add third-party integrations
   - OAuth connections
   - Import/export
   - Webhooks

5. **Analytics**: Add usage analytics
   - User behavior tracking
   - Feature usage metrics
   - Funnel analysis

6. **Monetisation** (if needed later): Add a payment provider
   - Stripe, LemonSqueezy, or other provider
   - Pricing page
   - Automated role assignment on checkout/cancellation
   - The role and subscription system is already in place — just wire up webhooks to update user_roles

---

## Differences from the SaaS Version

This open-source variant intentionally omits:

- **Pricing page** -- No /pricing route or pricing cards
- **Stripe integration** -- No checkout, subscription webhooks, or billing portal
- **Upsell modals / upgrade banners** -- No in-app purchase flow of any kind

What it keeps:

- **Subscription UI** -- Users see their current plan, premium badges, and role-gated features
- **PremiumGate** -- Features are gated by role exactly like the SaaS version
- **AI credits tied to role** -- Allowances are determined by the user's subscription tier
- **Role management** -- Admins assign and change roles via the admin panel instead of Stripe webhooks

Everything else is identical: auth, profiles, roles, AI credits, admin panel, activity logging, dark mode, SEO, and the full component library.

---

## Best Practices Followed

1. **Security**: RLS policies on all tables, role-based access
2. **Scalability**: Token-based AI system, efficient queries
3. **UX**: Loading states, error handling, responsive design
4. **Maintainability**: Component-based architecture, typed code
5. **Performance**: Code splitting, optimized queries
6. **Compliance**: Legal pages, GDPR considerations

---

## Next Steps After Foundation

Once the foundation is complete:

1. Define your specific value proposition
2. Design your core data model
3. Build the unique features that differentiate your product
4. Add AI capabilities using the credits system
5. Iterate based on user feedback

This foundation provides 80% of what every multi-user web app needs, letting you focus on the 20% that makes your product unique.
