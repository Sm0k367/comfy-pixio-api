// src/app/(marketing)/pricing/page.tsx
import { createClient } from '@/lib/supabase/server';
import { PRICING_TIERS, getTierByPriceId } from '@/lib/config/pricing';
import { siteMetadata } from '@/lib/config/metadata';
import { PricingClient } from '@/components/pricing/pricing-client';

export const metadata = {
  title: 'Pricing',
  description: 'View the pricing plans for AI Lounge After Dark.',
};

export default async function PricingPage() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Variable for client-side component to access
  const initialBillingInterval = 'monthly';
  
  // If user is authenticated, fetch their subscription to highlight current plan
  let userSubscription = null;
  let userTierId = 'free';
  let userBillingInterval: 'monthly' | 'yearly' = initialBillingInterval;
  
  if (user) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*, prices(id, products(*))')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active'])
      .maybeSingle();
    
    if (subscription) {
      userSubscription = subscription;
      
      // Determine which tier the user is on based on price ID
      const priceId = subscription.prices?.id;
      const { tier, interval } = getTierByPriceId(priceId);
      
      if (tier) {
        userTierId = tier.id;
        
        // If we have the interval information, use it as the initial billing interval
        if (interval) {
          userBillingInterval = interval;
        }
      }
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="text-center max-w-7xl mx-auto mb-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Pricing
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Choose the plan that's right for you and start creating with AI
            Lounge After Dark.
          </p>
        </div>
      </div>
      <PricingClient />
    </div>
  );
}