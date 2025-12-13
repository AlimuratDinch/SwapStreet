"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import AnimatedCounter from "@/components/AnimatedCounter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shirt,
  Leaf,
  Zap,
  Users,
  Droplet,
  Eye,
  Heart,
  ShoppingBag,
  ArrowRight,
  Shield,
  Sparkles,
  TrendingUp,
  Search,
  MessageCircle,
  Star,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const scrollRef = useRef(null);
  const scrollPosRef = useRef(0);
  const animIdRef = useRef(null);
  const isHoveredRef = useRef(false);
  const firstSpanRef = useRef(0);
  const chartRef = useRef(null);
  const [barHeights, setBarHeights] = useState(Array(12).fill(0));
  const [chartAnimated, setChartAnimated] = useState(false);
  const guideRef = useRef(null);
  const [guideVisible, setGuideVisible] = useState([false, false, false]);
  const ctaRef = useRef(null);
  const [typewriterText, setTypewriterText] = useState('');
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [heroText, setHeroText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const heroWords = ['Endless Outfits', 'Sustainable Fashion', 'Unique Styles', 'Eco-Friendly Choices', 'Personalized Looks'];

  // Simulated data for environmental impact (REPLACE WITH REAL DATA FROM BACKEND)
  const environmentalStats = {
    clothesSaved: 245680,
    co2Reduced: 892.5,
    waterSaved: 1456.7,
    usersActive: 89432,
  };

  const features = [
    {
      icon: <Eye className="h-8 w-8 text-teal-500" />,
      title: "AI Virtual Try-On",
      description:
        "See how clothes look on you before buying with our advanced 3D technology",
      badge: "Preview",
    },
    {
      icon: <Zap className="h-8 w-8 text-teal-500" />,
      title: "Smart Recommendations",
      description:
        "Get AI-powered outfit ideas customized for your style and any occasion: summer, winter, formal, streetwear and more",
      badge: "AI Powered",
    },
    {
      icon: <Leaf className="h-8 w-8 text-teal-500" />,
      title: "Sustainability Tracker",
      description:
        "Track your environmental impact and see how much you're helping the planet",
      badge: "Eco-Friendly",
    },
    {
      icon: <Users className="h-8 w-8 text-teal-500" />,
      title: "Community Features",
      description:
        "Connect with other fashion lovers, share collections, message sellers for additional details, plan meetups and get style inspiration",
      badge: "Social",
    },
    {
      icon: <Shield className="h-8 w-8 text-teal-500" />,
      title: "Secure Payments",
      description:
        "Shop with confidence using our encrypted payment system and buyer protection guarantee",
      badge: "Secure",
    },
    {
      icon: <Sparkles className="h-8 w-8 text-teal-500" />,
      title: "Quality Assurance",
      description:
        "Every item is verified for authenticity and condition before listing to ensure premium quality",
      badge: "Verified",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-teal-500" />,
      title: "Price Intelligence",
      description:
        "Get real-time market insights and pricing suggestions to buy or sell at the perfect price",
      badge: "Smart",
    },
    {
      icon: <Search className="h-8 w-8 text-teal-500" />,
      title: "Advanced Search",
      description:
        "Find exactly what you're looking for with powerful filters, image search and style matching",
      badge: "Enhanced",
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-teal-500" />,
      title: "Real-Time Chat",
      description:
        "Message sellers instantly, negotiate prices and get detailed item information on the spot",
      badge: "Instant",
    },
    {
      icon: <Star className="h-8 w-8 text-teal-500" />,
      title: "Reviews & Ratings",
      description:
        "Make informed decisions with verified buyer reviews and seller reputation scores",
      badge: "Trusted",
    },
  ];



  // Monthly Impact Growth data (REPLACE WITH REAL DATA FROM BACKEND)
  const monthlyValues = [40, 55, 60, 75, 85, 90, 95, 88, 92, 100, 105, 110];
  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Calculate previous 6 months ending w/ current month (inclusive)
  // This is to only show the previous 6 months on smaller devices where the entire graph may not fit
  const now = new Date();
  const currentMonthIndex = now.getMonth(); // 0-11
  const prevSix = Array.from(
    { length: 6 },
    (_, i) => (currentMonthIndex - 5 + i + 12) % 12,
  );
  const prevSixSet = new Set(prevSix);

  // Smooth infinite scroll (features carousel)
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const measureFirstSpan = () => {
      const children = scrollContainer.children;
      if (!children || children.length < 2) return 0;
      const first = children[0];
      const second = children[1];
      const firstRect = first.getBoundingClientRect();
      const secondRect = second.getBoundingClientRect();
      const gapPx = secondRect.left - (firstRect.left + firstRect.width);
      return firstRect.width + gapPx;
    };
    firstSpanRef.current = measureFirstSpan();

    const animate = () => {
      if (!isHoveredRef.current) {
        const pxPerFrame = 0.5; // speed
        scrollPosRef.current += pxPerFrame;
        const firstSpan = firstSpanRef.current;
        if (firstSpan > 0 && scrollPosRef.current >= firstSpan) {
          const firstChild = scrollContainer.firstElementChild;
          if (firstChild) {
            scrollContainer.appendChild(firstChild);
            scrollPosRef.current -= firstSpan;
            firstSpanRef.current = measureFirstSpan();
          }
        }
        scrollContainer.style.transform = `translate3d(-${scrollPosRef.current}px, 0, 0)`;
      }
      animIdRef.current = requestAnimationFrame(animate);
    };

    animIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [features.length]);

  // Animate Bar Chart
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !chartAnimated) {
            setChartAnimated(true);
            // Animate each bar sequentially
            monthlyValues.forEach((targetHeight, index) => {
              setTimeout(() => {
                let currentHeight = 0;
                const duration = 800;
                const increment = targetHeight / (duration / 16);
                
                const animateBar = () => {
                  currentHeight += increment;
                  if (currentHeight >= targetHeight) {
                    setBarHeights(prev => {
                      const newHeights = [...prev];
                      newHeights[index] = targetHeight;
                      return newHeights;
                    });
                  } else {
                    setBarHeights(prev => {
                      const newHeights = [...prev];
                      newHeights[index] = currentHeight;
                      return newHeights;
                    });
                    requestAnimationFrame(animateBar);
                  }
                };
                animateBar();
              }, index * 100);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, [chartAnimated]);

  // Animate Guide Section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate each box sequentially
            [0, 1, 2].forEach((index) => {
              setTimeout(() => {
                setGuideVisible(prev => {
                  const newVisible = [...prev];
                  newVisible[index] = true;
                  return newVisible;
                });
              }, index * 1000);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    if (guideRef.current) {
      observer.observe(guideRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Typewriter effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !showTypewriter) {
            setShowTypewriter(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (ctaRef.current) {
      observer.observe(ctaRef.current);
    }

    return () => observer.disconnect();
  }, [showTypewriter]);

  useEffect(() => {
    if (!showTypewriter) return;

    const fullText = 'Ready to Transform Your Wardrobe?';
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypewriterText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 80);

    return () => clearInterval(typeInterval);
  }, [showTypewriter]);

  // Rotating typewriter effect (Hero Section)
  useEffect(() => {
    const currentWord = heroWords[wordIndex];
    let timeout;

    if (!isDeleting && heroText === currentWord) {
      // Pause before delete
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && heroText === '') {
      // Move to next word
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % heroWords.length);
    } else {
      // Type or delete character
      const speed = isDeleting ? 50 : 100;
      timeout = setTimeout(() => {
        setHeroText(prev => 
          isDeleting 
            ? currentWord.substring(0, prev.length - 1)
            : currentWord.substring(0, prev.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timeout);
  }, [heroText, isDeleting, wordIndex]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shirt className="h-8 w-8 text-teal-500" />
            <span className="text-2xl font-bold text-foreground max-[425px]:hidden">
              SWAPSTREET
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#impact"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Impact
            </Link>
            <Link
              href="#guide"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Guide
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/sign-in">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/50 to-emerald-900/50 z-10" />

        {/* Background Image/Video */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('./images/hero.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center text-white max-w-4xl mx-auto px-4 pt-20 md:pt-0">
          <h1 className="text-5xl md:text-7xl max-[390px]:text-4xl max-[375px]:text-4xl max-[360px]:text-3xl max-[320px]:text-2xl font-bold mb-6 leading-tight max-[390px]:leading-snug max-[375px]:leading-snug max-[320px]:leading-tight flex flex-col items-center gap-1">
            <span className="block whitespace-nowrap max-[500px]:text-3xl max-[400px]:text-2xl max-[340px]:text-xl text-center w-full">The Marketplace for</span>
            <span className="text-teal-400 block min-h-[1.2em] whitespace-nowrap max-[500px]:text-3xl max-[400px]:text-2xl max-[340px]:text-xl text-center inline-block sm:min-w-[25ch]">
              {heroText}<span className="animate-pulse">|</span>
            </span>
          </h1>
          <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto max-[400px]:text-base">
            Discover, buy and sell secondhand clothing with AI-powered virtual
            try-ons, personalized recommendations, and real environmental impact
            tracking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 text-lg"
              asChild
            >
              <Link href="/browse">Start Shopping</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">
                <AnimatedCounter target={environmentalStats.clothesSaved} />+
              </div>
              <div className="text-sm text-white/80">Clothes Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">
                <AnimatedCounter target={environmentalStats.co2Reduced} decimals={1} />T
              </div>
              <div className="text-sm text-white/80">CO2 Reduced</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">
                <AnimatedCounter target={environmentalStats.waterSaved} decimals={1} />M
              </div>
              <div className="text-sm text-white/80">Liters Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">
                <AnimatedCounter target={environmentalStats.usersActive} />+
              </div>
              <div className="text-sm text-white/80">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 bg-gradient-to-br from-slate-50 via-slate-50 to-teal-50/30 relative overflow-visible">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-400/5 via-emerald-400/5 to-teal-400/5 animate-gradientShift opacity-40 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="text-center mb-16 container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 pb-2 leading-tight bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Revolutionary Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the next generation of online fashion shopping with
              cutting-edge technology that makes finding your perfect style
              easier and more sustainable than ever.
            </p>
          </div>

          {/* Infinite Carousel */}
          <div className="relative overflow-visible w-full py-4">
            <div 
              ref={scrollRef}
              className="flex gap-6"
              onMouseEnter={() => {
                isHoveredRef.current = true;
              }}
              onMouseLeave={() => {
                isHoveredRef.current = false;
              }}
            >
              {[...features, ...features].map((feature, index) => (
                <div
                  key={`feature-${index}`}
                  className="w-[280px] flex-shrink-0"
                >
                  <Card className="relative overflow-hidden group h-full bg-white/40 backdrop-blur-lg border border-white/60 hover:border-teal-400/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(20,184,166,0.25)] hover:scale-[1.05] hover:z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-400/0 to-emerald-400/0 group-hover:from-teal-400/10 group-hover:to-emerald-400/10 transition-all duration-500 pointer-events-none" />

                    <CardContent className="p-8 text-center relative z-10">
                      <div className="absolute top-4 right-4">
                        <Badge
                          variant="secondary"
                          className="bg-teal-100 text-teal-700"
                        >
                          {feature.badge}
                        </Badge>
                      </div>

                      <div className="mb-6 flex justify-center">
                        <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-full group-hover:animate-iconBounce transition-all duration-300">
                          {feature.icon}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold mb-4 group-hover:text-teal-600 transition-colors duration-300">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Environmental Impact Section */}
      <section id="impact" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Our Environmental Impact
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See the real difference we're making together in creating a more
              sustainable fashion industry.
            </p>
          </div>

          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <Card className="text-center p-8 bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
              <Leaf className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-700 mb-2">
                Carbon Footprint
              </h3>
              <div className="text-4xl font-bold text-green-600 mb-2">
                <AnimatedCounter target={environmentalStats.co2Reduced} decimals={1} triggerOnView={true} />T
              </div>
              <p className="text-green-600">CO2 emissions prevented</p>
            </Card>

            <Card className="text-center p-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <Droplet className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-blue-700 mb-2">
                Water Conservation
              </h3>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                <AnimatedCounter target={environmentalStats.waterSaved} decimals={1} triggerOnView={true} />M
              </div>
              <p className="text-blue-600">
                Liters of water saved from production
              </p>
            </Card>

            <Card className="text-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <Heart className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-purple-700 mb-2">
                Clothes Rescued
              </h3>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                <AnimatedCounter target={environmentalStats.clothesSaved} triggerOnView={true} />
              </div>
              <p className="text-purple-600">Items given a second life</p>
            </Card>
          </div>

          {/* Impact Visualization */}
          <div ref={chartRef} className="bg-card rounded-xl p-6 md:p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-8 text-center">
              Monthly Impact Growth
            </h3>
            <div className="grid grid-cols-6 gap-1 sm:grid-cols-12 sm:gap-2 h-40 sm:h-56 md:h-64 items-end">
              {monthlyValues.map((height, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-t from-teal-500 to-teal-400 rounded-t-sm md:rounded-t-md relative group transition-all duration-300 ${
                    !prevSixSet.has(index) ? "hidden sm:block" : ""
                  }`}
                  style={{ height: `${barHeights[index]}%` }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {height}%
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-sm text-muted-foreground">
              {monthLabels.map((label, i) => (
                <span
                  key={label}
                  className={`${!prevSixSet.has(i) ? "hidden sm:block" : ""}`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="guide" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How SWAPSTREET Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of fashion-forward individuals making sustainable
              choices
            </p>
          </div>

          <div ref={guideRef} className="grid md:grid-cols-3 gap-12">
            <div className={`text-center transition-all duration-700 ease-out ${
              guideVisible[0] ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'
            }`}>
              <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">1. Browse & Discover</h3>
              <p className="text-muted-foreground">
                Shop secondhand fashion from people around the world. Message
                sellers for more details about any item.
              </p>
            </div>

            <div className={`text-center transition-all duration-700 ease-out ${
              guideVisible[1] ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'
            }`}>
              <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">2. Try Before You Buy</h3>
              <p className="text-muted-foreground">
                Use our AI virtual try-on technology to see how clothes look on
                you
              </p>
            </div>

            <div className={`text-center transition-all duration-700 ease-out ${
              guideVisible[2] ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'
            }`}>
              <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Leaf className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">3. Shop Sustainably</h3>
              <p className="text-muted-foreground">
                Make purchases that help the environment and track your positive
                impact
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-20 bg-gradient-to-br from-teal-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 min-h-[3.5rem] md:min-h-[4rem]">
            {typewriterText}<span className="animate-pulse">|</span>
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join the sustainable fashion revolution. Start buying and selling
            secondhand clothes today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-teal-600 hover:bg-gray-100 px-8 py-4 text-lg group"
              asChild
            >
              <Link href="/auth/sign-up" className="inline-flex items-center justify-center gap-2">
                Get Started Free
                <ArrowRight className="h-5 w-5 -mr-7 opacity-0 group-hover:mr-0 group-hover:opacity-100 transition-all duration-300" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shirt className="h-8 w-8 text-teal-500" />
              <span className="text-2xl font-bold">SWAPSTREET</span>
            </div>

            <div className="flex items-center space-x-6 text-muted-foreground">
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>

          <div className="text-center text-muted-foreground mt-8 pt-8 border-t border-border">
            © 2025 SWAPSTREET. Made with ❤.
          </div>
        </div>
      </footer>
    </div>
  );
}
