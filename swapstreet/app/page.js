"use client";

import { Button } from "@/components/ui/button";
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
  Play,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
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
      badge: "Coming Soon",
    },
    {
      icon: <Zap className="h-8 w-8 text-teal-500" />,
      title: "Smart Recommendations",
      description:
        "Get AI-powered outfit ideas customized for your style and any occasion—summer, winter, formal, streetwear, and more",
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
  ];

  // Monthly Impact Growth data (REPLACE WITH REAL DATA FROM BACKEND)
  const monthlyValues = [40, 55, 60, 75, 85, 90, 95, 88, 92, 100, 105, 110];
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug","Sep", "Oct", "Nov", "Dec"];
  
  // Calculate previous 6 months ending w/ current month (inclusive)
  // This is to only show the previous 6 months on smaller devices where the entire graph may not fit
  const now = new Date();
  const currentMonthIndex = now.getMonth(); // 0-11
  const prevSix = Array.from({ length: 6 }, (_, i) => (currentMonthIndex - 5 + i + 12) % 12,);
  const prevSixSet = new Set(prevSix);

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
              href="#about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
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
          <div className="relative z-20 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl max-[375px]:text-4xl font-bold mb-6 leading-tight max-[375px]:leading-snug">
            The Marketplace for
            <span className="text-teal-400 block">Endless Outfits</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
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
              <Link href="/signup">Start Shopping</Link>
            </Button>
            <Button
              size="lg"
              className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 text-lg"
              asChild
            >
              <Link href="/browse">(TEMPORARY BROWSE)</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">
                {environmentalStats.clothesSaved.toLocaleString()}+
              </div>
              <div className="text-sm text-white/80">Clothes Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">
                {environmentalStats.co2Reduced}T
              </div>
              <div className="text-sm text-white/80">CO2 Reduced</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">
                {environmentalStats.waterSaved}M
              </div>
              <div className="text-sm text-white/80">Liters Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">
                {environmentalStats.usersActive.toLocaleString()}+
              </div>
              <div className="text-sm text-white/80">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Revolutionary Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the next generation of online fashion shopping with
              cutting-edge technology that makes finding your perfect style
              easier and more sustainable than ever.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-teal-500/50"
              >
                <CardContent className="p-8 text-center">
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant="secondary"
                      className="bg-teal-100 text-teal-700"
                    >
                      {feature.badge}
                    </Badge>
                  </div>

                  <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-teal-50 rounded-full">
                      {feature.icon}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
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
                {environmentalStats.co2Reduced}T
              </div>
              <p className="text-green-600">CO2 emissions prevented</p>
            </Card>

            <Card className="text-center p-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <Droplet className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-blue-700 mb-2">
                Water Conservation
              </h3>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {environmentalStats.waterSaved}M
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
                {environmentalStats.clothesSaved.toLocaleString()}
              </div>
              <p className="text-purple-600">Items given a second life</p>
            </Card>
          </div>

          {/* Impact Visualization */}
            <div className="bg-card rounded-xl p-6 md:p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-8 text-center">
              Monthly Impact Growth
            </h3>
            <div className="grid grid-cols-6 gap-1 sm:grid-cols-12 sm:gap-2 h-40 sm:h-56 md:h-64 items-end">
              {monthlyValues.map((height, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-t from-teal-500 to-teal-400 rounded-t-sm md:rounded-t-md relative group ${
                    !prevSixSet.has(index) ? "hidden sm:block" : ""
                  }`}
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {height}%
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-sm text-muted-foreground">
              {monthLabels.map((label, i) => (
                <span key={label} className={`${!prevSixSet.has(i) ? "hidden sm:block" : ""}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
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

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">1. Browse & Discover</h3>
              <p className="text-muted-foreground">
                Shop secondhand fashion from people around the world. Message
                sellers for more details about any item.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">2. Try Before You Buy</h3>
              <p className="text-muted-foreground">
                Use our AI virtual try-on technology to see how clothes look on
                you
              </p>
            </div>

            <div className="text-center">
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
      <section className="py-20 bg-gradient-to-br from-teal-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Wardrobe?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join the sustainable fashion revolution. Start buying and selling
            secondhand clothes today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-teal-600 hover:bg-gray-100 px-8 py-4 text-lg"
              asChild
            >
              <Link href="/auth/sign-up">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
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
