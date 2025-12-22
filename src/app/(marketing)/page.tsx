import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useSpring,
  useInView,
  AnimatePresence
} from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PRICING_TIERS, PricingTier, getTierByPriceId } from '@/lib/config/pricing';
import { Check, ExternalLink, ArrowRight, Star, Sparkles, Zap, Github } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Subscription } from '@/types/db_types';
import { Footer } from '@/components/shared/footer';
import { Navbar } from '@/components/shared/navbar';

// Define prop types for components
interface WorkflowCardProps {
  title: string;
  description: string;
  link: string;
  icon: React.ReactNode;
  index: number;
}

// --- MouseTrackCard with Border Glow ---
const MouseTrackCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Springs for animation - always initialize them
  const springConfig = { stiffness: 150, damping: 20 };
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);

  // Always create the motion template regardless of hover state
  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.02 : 1})`;

  // Client-side effect
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !isHovered) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -8;
    const rotateYValue = ((x - centerX) / centerX) * 8;

    setMousePosition({ x: rotateYValue, y: rotateXValue });
  };

  // Update spring animations
  useEffect(() => {
    if (isHovered) {
      rotateX.set(mousePosition.y);
      rotateY.set(mousePosition.x);
    } else {
      rotateX.set(0);
      rotateY.set(0);
    }
  }, [mousePosition, isHovered, rotateX, rotateY]);

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className || ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ transformStyle: "preserve-3d", transform }}
    >
      {/* Border Glow effect - visible when mounted and hovered */}
      <motion.div
        className="absolute -inset-0.5 rounded-[inherit] z-[-1]"
        style={{
          // Apply a box shadow for the glow effect
          boxShadow: isMounted && isHovered
            ? '0 0 15px 3px oklch(var(--primary) / 0.5)' // Use primary color with alpha
            : 'none',
          opacity: isMounted && isHovered ? 1 : 0, // Control visibility
          transition: 'box-shadow 0.3s ease-in-out, opacity 0.3s ease-in-out', // Smooth transition
        }}
      />
      {children}
    </motion.div>
  );
};


// Fixed Animated Background to prevent hydration mismatch
const AnimatedBackground = () => {
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Only run on client side
  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate mouse position relative to viewport center
      const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1

      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Use consistent deterministic values for server rendering
  // Generate fixed positions for particles to prevent hydration mismatch
  const particlePositions = Array.from({ length: 20 }).map((_, i) => ({
    top: `${(i * 5) % 100}%`,
    left: `${(i * 7) % 100}%`,
    opacity: 0.3 + ((i % 5) * 0.1),
    animationDuration: `${10 + (i % 10)}s`,
    animationDelay: `${(i % 10) * 0.5}s`
  }));

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />

      {/* Grid pattern - only add mousemove effect after mount */}
      <div
        className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:10px_10px] bg-repeat opacity-5"
        style={mounted ? {
          transform: `translateX(${mousePosition.x * -5}px) translateY(${mousePosition.y * -5}px)`,
          transition: "transform 1s cubic-bezier(0.075, 0.82, 0.165, 1)"
        } : {}}
      />

      {/* Moving circles - large ones with conditional transforms */}
      <div
        className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] rounded-full bg-primary/5 filter blur-[100px] animate-float"
        style={{
          animationDuration: '30s',
          transform: mounted ? `translateX(${mousePosition.x * -30}px) translateY(${mousePosition.y * -30}px)` : 'none'
        }}
      />
      <div
        className="absolute top-[40%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-secondary/5 filter blur-[100px] animate-float"
        style={{
          animationDuration: '25s',
          animationDelay: '2s',
          transform: mounted ? `translateX(${mousePosition.x * -20}px) translateY(${mousePosition.y * -20}px)` : 'none'
        }}
      />
      <div
        className="absolute bottom-[15%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-accent/5 filter blur-[100px] animate-float"
        style={{
          animationDuration: '28s',
          animationDelay: '1s',
          transform: mounted ? `translateX(${mousePosition.x * -25}px) translateY(${mousePosition.y * -25}px)` : 'none'
        }}
      />

      {/* Moving circles - medium ones */}
      <div className="absolute top-[30%] left-[25%] w-[20vw] h-[20vw] rounded-full bg-primary/10 filter blur-[80px] animate-float" style={{ animationDuration: '20s', animationDelay: '3s' }}></div>
      <div className="absolute top-[60%] right-[25%] w-[25vw] h-[25vw] rounded-full bg-secondary/10 filter blur-[80px] animate-float" style={{ animationDuration: '22s', animationDelay: '2.5s' }}></div>

      {/* Moving circles - small ones */}
      <div className="absolute top-[15%] right-[30%] w-[10vw] h-[10vw] rounded-full bg-accent/10 filter blur-[50px] animate-float" style={{ animationDuration: '18s', animationDelay: '1.5s' }}></div>
      <div className="absolute bottom-[25%] right-[15%] w-[15vw] h-[15vw] rounded-full bg-primary/10 filter blur-[60px] animate-float" style={{ animationDuration: '15s', animationDelay: '1s' }}></div>
      <div className="absolute bottom-[45%] left-[10%] w-[12vw] h-[12vw] rounded-full bg-secondary/10 filter blur-[60px] animate-float" style={{ animationDuration: '17s', animationDelay: '0.5s' }}></div>

      {/* Animated particles with fixed positions to prevent hydration mismatch */}
      <div className="particles absolute inset-0 z-0">
        {particlePositions.map((pos, i) => (
          <div
            key={i}
            className="particle absolute w-1 h-1 rounded-full bg-white/40"
            style={{
              top: pos.top,
              left: pos.left,
              opacity: pos.opacity,
              animation: `float ${pos.animationDuration} linear infinite`,
              animationDelay: pos.animationDelay
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Fixed MagneticButton - similar approach to MouseTrackCard
const MagneticButton: React.FC<{
  children: React.ReactNode,
  className?: string,
  onClick?: () => void,
  disabled?: boolean; // Added disabled prop
}> = ({ children, className, onClick, disabled }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Always initialize the springs
  const xMotion = useSpring(0, { damping: 20, stiffness: 200 });
  const yMotion = useSpring(0, { damping: 20, stiffness: 200 });

  // Client-side effect
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || !isHovered || disabled) return; // Ignore if disabled

    const rect = buttonRef.current.getBoundingClientRect();
    // Calculate distance from center
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);

    // Scale down movement for subtlety (maximum 10px movement)
    setPosition({
      x: x * 0.2,
      y: y * 0.2
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  };

  // Update springs in useEffect
  useEffect(() => {
    if (isMounted && !disabled) { // Only update if not disabled
      xMotion.set(position.x);
      yMotion.set(position.y);
    } else { // Reset if disabled
      xMotion.set(0);
      yMotion.set(0);
    }
  }, [position, xMotion, yMotion, isMounted, disabled]);

  return (
    <motion.button
      ref={buttonRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => !disabled && setIsHovered(true)} // Only hover if not disabled
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled} // Pass disabled prop
      style={{
        x: xMotion,
        y: yMotion,
        transition: "transform 0.1s ease"
      }}
    >
      {children}
    </motion.button>
  );
};

// Enhanced underlined heading with gradient
const GradientHeading: React.FC<{
  children: React.ReactNode,
  className?: string,
  from?: string,
  via?: string,
  to?: string
}> = ({ children, className, from = "from-primary", via = "via-secondary", to = "to-accent" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <motion.div
      ref={ref}
      className={`relative inline-block ${className || ''}`}
      initial={isMounted ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
      animate={isMounted && isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className={`text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${from} ${via} ${to}`}>
        {children}
      </h2>
      {isMounted && (
        <motion.div
          className={`absolute -bottom-2 left-0 h-1 bg-gradient-to-r ${from} ${via} ${to} rounded-full`}
          initial={{ width: "0%" }}
          animate={isInView ? { width: "100%" } : { width: "0%" }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </motion.div>
  );
};

// Workflow card component
const WorkflowCard = ({ title, description, link, icon, index }: WorkflowCardProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <MouseTrackCard className="h-full">
      <Card className="glass-card h-full backdrop-blur-lg border border-white/20 dark:border-white/10 hover:shadow-lg hover:shadow-primary/10 dark:hover:shadow-primary/20 transition-all duration-300 overflow-hidden">
        <motion.div
          initial={isMounted ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
          whileInView={isMounted ? { opacity: 1, y: 0 } : {}}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 * index }}
          className="h-full flex flex-col"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              {icon}
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            <CardDescription className="text-sm text-foreground/80">{description}</CardDescription>
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              variant="outline"
              className="gap-1 glass-button bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 hover:text-primary w-full justify-center group"
              asChild
            >
              <Link href={link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>Open in Pixio API</span>
              </Link>
            </Button>
          </CardFooter>
        </motion.div>
      </Card>
    </MouseTrackCard>
  );
};

// --- Pricing section integrated for the homepage ---
interface PricingSectionProps {
  userTierId: string;
  isAuthenticated: boolean;
}

const PricingSection = ({ userTierId, isAuthenticated }: PricingSectionProps) => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isMounted, setIsMounted] = useState(false);
  const switchRef = useRef<HTMLButtonElement>(null);
  const toggleAnimation = useRef(false);
  const [isLoading, setIsLoading] = useState<string | null>(null); // State for button loading

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Animate the toggle switch on initial render - only on client
  useEffect(() => {
    if (isMounted && !toggleAnimation.current && switchRef.current) {
      setTimeout(() => {
        setBillingInterval('yearly');
        setTimeout(() => {
          setBillingInterval('monthly');
          toggleAnimation.current = true;
        }, 1500);
      }, 1000);
    }
  }, [isMounted]);

  // Function to handle subscription with redirect checkout
  const handleSubscribe = async (priceId: string) => {
    // This should only be called if isAuthenticated is true
    if (!isAuthenticated) return;

    setIsLoading(priceId);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error.message || 'Something went wrong');
      setIsLoading(null);
    }
  };


  return (
    <>
      <div className="text-center mb-12">
        <GradientHeading className="mb-4 justify-center mx-auto text-center">
          Simple, Transparent Pricing
        </GradientHeading>
        <motion.p
          className="text-lg text-muted-foreground mb-8"
          initial={isMounted ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
          whileInView={isMounted ? { opacity: 1, y: 0 } : {}}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Choose the perfect plan for your needs. All plans include access to Pixio API machines.
        </motion.p>

        {/* Billing toggle */}
        <motion.div
          className="flex items-center justify-center space-x-4 mb-8"
          initial={isMounted ? { opacity: 0 } : { opacity: 1 }}
          whileInView={isMounted ? { opacity: 1 } : {}}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <span className={`text-sm ${billingInterval === 'monthly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <button
            ref={switchRef}
            type="button"
            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary/20 backdrop-blur-sm transition-colors duration-300 ease-spring focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 group"
            role="switch"
            aria-checked={billingInterval === 'yearly'}
            onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
          >
            <motion.span
              aria-hidden="true"
              className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-all duration-300"
              animate={isMounted ? {
                x: billingInterval === 'yearly' ? 20 : 0
              } : {}}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            />
            <span className="sr-only">{billingInterval === 'monthly' ? 'Switch to yearly billing' : 'Switch to monthly billing'}</span>

            {/* Particle effects on toggle - client-side only */}
            {isMounted && (
              <AnimatePresence>
                {billingInterval === 'yearly' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-0 top-0"
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute h-1 w-1 rounded-full bg-accent/50"
                        initial={{
                          x: 0,
                          y: 0,
                          opacity: 1,
                          scale: 0.5 + (i * 0.1)
                        }}
                        animate={{
                          x: ((i % 3) - 1) * 10,
                          y: ((i % 3) - 1) * 10,
                          opacity: 0,
                          scale: 0
                        }}
                        transition={{
                          duration: 0.4 + (i * 0.1),
                          ease: "easeOut"
                        }}
                        style={{
                          top: `${(i * 20) + 10}%`,
                          right: `${(i * 10) + 10}%`
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </button>
          <span className={`text-sm flex items-center gap-1.5 ${billingInterval === 'yearly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            Yearly
            <motion.span
              className="inline-block px-1.5 py-0.5 text-xs rounded-full bg-accent/10 text-accent/90 font-medium backdrop-blur-sm"
              animate={isMounted ? {
                scale: billingInterval === 'yearly' ? [1, 1.1, 1] : 1
              } : {}}
              transition={{
                duration: 0.4,
                times: [0, 0.5, 1],
                ease: "easeInOut"
              }}
            >
              Save up to 16%
            </motion.span>
          </span>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {PRICING_TIERS.map((tier, index) => {
          const price = tier.pricing[billingInterval];
          const isCurrentPlan = userTierId === tier.id;

          // Determine button content and action based on authentication state
          let buttonContent: React.ReactNode;
          let buttonAction: (() => void) | undefined;
          let buttonLink: string | undefined;
          let buttonDisabled = false;
          let buttonStyleClass = tier.popular
            ? 'bg-gradient-to-r from-primary/90 to-secondary/90 text-white hover:opacity-90'
            : 'glass-button bg-white/10 hover:bg-white/20 text-foreground';

          if (!isAuthenticated) {
            // --- Unauthenticated User Logic ---
            buttonContent = "Sign up";
            buttonLink = "/signup";
            buttonStyleClass = 'glass-button bg-white/10 hover:bg-white/20 text-foreground'; // Consistent style for signup
          } else {
            // --- Authenticated User Logic ---
            if (price.priceId) {
              // Paid Tier
              if (isCurrentPlan) {
                buttonContent = "Current Plan";
                buttonDisabled = true;
                buttonStyleClass += ' cursor-not-allowed opacity-60';
              } else {
                buttonContent = isLoading === price.priceId ? 'Processing...' : 'Subscribe';
                buttonAction = () => handleSubscribe(price.priceId!);
                buttonDisabled = isLoading === price.priceId;
              }
            } else {
              // Free Tier
              if (isCurrentPlan) {
                buttonContent = "Current Plan";
                buttonDisabled = true;
                buttonStyleClass += ' cursor-not-allowed opacity-60';
              } else {
                buttonContent = "Get Started";
                buttonLink = "/dashboard"; // Authenticated users go to dashboard from free tier
              }
            }
          }

          return (
            <MouseTrackCard key={tier.id} className="h-full">
              <motion.div
                initial={isMounted ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
                whileInView={isMounted ? { opacity: 1, y: 0 } : {}}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
                className="h-full"
              >
                <Card className={`glass-card backdrop-blur-lg border relative overflow-hidden h-full flex flex-col
                  ${tier.popular ? 'border-primary/30 shadow-lg shadow-primary/10 dark:shadow-primary/20' : 'border-white/20 dark:border-white/10'}
                  hover:shadow-xl hover:shadow-primary/10 dark:hover:shadow-primary/20 transition-all duration-300`}
                >
                  {tier.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-primary/90 to-secondary/90 text-white text-xs px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span>Popular</span>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className={`text-xl ${tier.popular ? "text-primary" : ""}`}>{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                    <div className="mt-4">
                      {price.amount ? (
                        <div className="flex items-end">
                          <motion.span
                            className="text-3xl font-bold"
                            key={`${price.amount}-${billingInterval}`}
                            initial={isMounted ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
                            animate={isMounted ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            {formatPrice(price.amount)}
                          </motion.span>
                          <span className="text-muted-foreground ml-1 mb-1">/{billingInterval === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>
                      ) : (
                        <span className="text-3xl font-bold">Free</span>
                      )}

                      {isMounted && billingInterval === 'yearly' && tier.pricing.yearly.discount && (
                        <motion.p
                          className="text-sm text-accent/90 mt-1"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key="yearly-discount"
                          transition={{ duration: 0.3, delay: 0.1 }}
                        >
                          Save {tier.pricing.yearly.discount}% with annual billing
                        </motion.p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pb-0 flex-grow">
                    <ul className="space-y-2">
                      {tier.features.map((feature, i) => (
                        <motion.li
                          key={i}
                          className="flex items-start gap-2"
                          initial={isMounted ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
                          whileInView={isMounted ? { opacity: 1, x: 0 } : {}}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: 0.05 * i }}
                        >
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-6 mt-6">
                    <MagneticButton
                      onClick={buttonAction}
                      disabled={buttonDisabled}
                      className={`w-full rounded-md py-2 px-4 font-medium ${buttonStyleClass}`}
                    >
                      {buttonLink ? (
                        <Link href={buttonLink} className="flex items-center justify-center w-full h-full">
                          {buttonContent}
                        </Link>
                      ) : (
                        buttonContent
                      )}
                    </MagneticButton>
                  </CardFooter>
                </Card>
              </motion.div>
            </MouseTrackCard>
          );
        })}
      </div>
    </>
  );
};


// --- Main Landing Page Component ---
export default function MarketingPage() {
  const images = Array.from({ length: 69 }, (_, i) => `/brand_media/${i + 1}.jpeg`);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <section className="relative py-20 text-center">
          <div className="container">
            <h1 className="text-4xl font-bold md:text-6xl">
              Welcome to AI Lounge After Dark
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Your creative space for AI-powered media generation.
            </p>
            <div className="mt-8">
              <video
                className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
                src="/brand_media/grok-video-1974311848104046593.mp4"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>
        </section>
        <section className="py-20">
          <div className="container">
            <h2 className="mb-12 text-3xl font-bold text-center md:text-4xl">
              Our Gallery
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {images.map((src, index) => (
                <div key={index} className="overflow-hidden rounded-lg shadow-lg">
                  <img
                    src={src}
                    alt={`Gallery image ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}