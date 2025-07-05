"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Beams from "@/components/ui/beams";
import BlurText from "./blocks/TextAnimations/BlurText/BlurText";
import {
  Castle,
  Shield,
  Globe,
  Bot,
  Vote,
  PartyPopper,
  Brain,
  Sparkles,
  Users,
  Coins,
} from "lucide-react";
import InViewMotion from "@/components/InViewMotion";

export default function Home() {
  const features = [
    {
      icon: Castle,
      title: "Multi-DAO Onboarding",
      description:
        "Create dedicated portals by staking minimum 2 APT. Onboard existing or new DAOs with complete governance infrastructure.",
      color: "from-red-500 to-pink-500",
    },
    {
      icon: Shield,
      title: "Role-Based Governance",
      description:
        "Assign Owners and Governors with customizable voting power distribution between Community and Governors.",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Globe,
      title: "Cross-DAO Discovery",
      description:
        "Explore and participate in proposals and events across multiple DAOs based on ROI and personal interests.",
      color: "from-pink-500 to-purple-500",
    },
    {
      icon: Bot,
      title: "AI Councilors",
      description:
        "Mint on-chain AI personas that reflect your motivations and flag relevant DAO activities with personalized insights.",
      color: "from-purple-500 to-indigo-500",
    },
    {
      icon: Vote,
      title: "Weighted Voting System",
      description:
        "Fair voting with staked amounts determining weight. Every 10 APT equals 1 vote with normalization for fairness.",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: PartyPopper,
      title: "Events & Rewards",
      description:
        "Participate in raffles, giveaways, and hackathons. AI suggestions retrievable by user address.",
      color: "from-blue-500 to-cyan-500",
    },
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Stake & Create",
      description:
        "Stake minimum 2 APT to create your DAO portal and onboard your community",
      icon: Coins,
    },
    {
      step: "02",
      title: "Assign Roles",
      description:
        "Set up Owners, Governors, and Community with customizable power distribution",
      icon: Users,
    },
    {
      step: "03",
      title: "Mint AI Councilor",
      description:
        "Create your on-chain AI persona to get personalized DAO recommendations",
      icon: Bot,
    },
    {
      step: "04",
      title: "Participate & Govern",
      description:
        "Vote on proposals, join events, and engage in cross-DAO governance",
      icon: Vote,
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Beams */}
      <div className="fixed inset-0 z-0">
        <Beams
          beamWidth={2}
          beamHeight={32}
          beamNumber={20}
          lightColor="#ff0000"
          speed={5}
          noiseIntensity={2}
          scale={0.2}
          rotation={135}
          beamSpacing={0}
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="flex flex-col items-center justify-center text-center gap-8 max-w-6xl mx-auto">
          {/* Hero Badge */}
          <Badge
            variant="outline"
            className="bg-white/10 border-red-400/30 text-red-200 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Next-Gen DAO Governance Platform
          </Badge>

          {/* Main Title */}
          <div className="w-full flex justify-center">
            <BlurText
              text="Onboard, Govern, and Innovate with ArcheDAO Portal DApp"
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 drop-shadow-2xl leading-tight"
              animateBy="words"
              direction="top"
              delay={100}
            />
          </div>

          {/* Subtitle */}
          <div className="max-w-4xl mx-auto mb-8">
            <BlurText
              text="Create or join DAOs, stake APT, assign roles, and participate in cross-DAO governance. Mint AI Councilors, explore proposals and events, and experience fair, weighted voting—all in a seamless, glassmorphic ecosystem."
              className="text-lg md:text-xl text-red-100/90 font-medium drop-shadow-md leading-relaxed"
              animateBy="words"
              direction="top"
              delay={60}
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {/* <Button
              size="lg"
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-red-500/25 transition-all duration-300 hover:shadow-red-500/40 hover:scale-105"
              onClick={() => !connected && connect()}
            >
              <Wallet className="w-5 h-5 mr-2" />
              {connected
                ? `Connected: ${account?.address?.toString().slice(0, 6)}...`
                : "Connect Wallet"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button> */}
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            >
              Explore DAOs
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <BlurText
              text="How It Works"
              className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg"
              animateBy="words"
              direction="top"
              delay={80}
            />
            <p className="text-xl text-red-100/80 max-w-2xl mx-auto">
              Four simple steps to revolutionize your DAO experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => {
              const Icon = item.icon;
              return (
                <InViewMotion key={index}>
                  <Card className="bg-white/5 border border-red-400/20 backdrop-blur-xl shadow-xl shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-500 hover:scale-105 hover:bg-white/10 group">
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-red-400 mb-2">
                        {item.step}
                      </div>
                      <CardTitle className="text-white text-xl">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 text-center leading-relaxed">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </InViewMotion>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <BlurText
              text="Powerful Features"
              className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg"
              animateBy="words"
              direction="top"
              delay={80}
            />
            <p className="text-xl text-red-100/80 max-w-3xl mx-auto">
              Everything you need for next-generation DAO governance and
              community management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <InViewMotion key={index}>
                  <Card className="bg-white/5 border border-red-400/20 backdrop-blur-xl shadow-xl shadow-red-500/10 hover:shadow-red-500/25 transition-all duration-500 hover:scale-105 hover:bg-white/10 group overflow-hidden relative">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                    />
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`p-3 rounded-lg bg-gradient-to-br ${feature.color} group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-white text-xl group-hover:text-red-100 transition-colors">
                          {feature.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </InViewMotion>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Councilor Highlight */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <InViewMotion>
            <Card className="bg-gradient-to-br from-white/10 to-white/5 border border-red-400/30 backdrop-blur-xl shadow-2xl shadow-red-500/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10" />
              <CardHeader className="relative z-10 text-center pb-8">
                <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl md:text-4xl font-bold text-white mb-4">
                  AI Councilor Integration
                </CardTitle>
                <CardDescription className="text-lg text-red-100/80 max-w-2xl mx-auto leading-relaxed">
                  Revolutionary on-chain AI personas that understand your
                  preferences, flag relevant activities, and provide
                  personalized governance insights across all your DAO
                  participations.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 text-center">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      Personalized
                    </div>
                    <p className="text-gray-300">
                      AI reflects your motivations and preferences
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      Intelligent
                    </div>
                    <p className="text-gray-300">
                      Flags relevant proposals and events
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      Actionable
                    </div>
                    <p className="text-gray-300">
                      Generates personalized action items
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-105"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Mint Your AI Councilor
                </Button>
              </CardContent>
            </Card>
          </InViewMotion>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <InViewMotion>
              <div className="bg-white/5 border border-red-400/20 backdrop-blur-xl rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="text-4xl font-bold text-white mb-2">2 APT</div>
                <p className="text-red-100/80">
                  Minimum stake to create DAO portal
                </p>
              </div>
            </InViewMotion>
            <InViewMotion>
              <div className="bg-white/5 border border-red-400/20 backdrop-blur-xl rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="text-4xl font-bold text-white mb-2">10:1</div>
                <p className="text-red-100/80">
                  APT to vote ratio for fair governance
                </p>
              </div>
            </InViewMotion>
            <InViewMotion>
              <div className="bg-white/5 border border-red-400/20 backdrop-blur-xl rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="text-4xl font-bold text-white mb-2">∞</div>
                <p className="text-red-100/80">
                  Cross-DAO participation possibilities
                </p>
              </div>
            </InViewMotion>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <BlurText
            text="Ready to Transform DAO Governance?"
            className="text-4xl md:text-5xl font-bold text-white mb-8 drop-shadow-lg"
            animateBy="words"
            direction="top"
            delay={80}
          />
          <p className="text-xl text-red-100/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join the future of decentralized governance with AI-powered
            insights, fair voting mechanisms, and seamless cross-DAO
            participation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-red-500/25 transition-all duration-300 hover:shadow-red-500/40 hover:scale-105"
            >
              <Castle className="w-5 h-5 mr-2" />
              Create Your DAO Portal
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            >
              Explore Documentation
            </Button>
          </div>
        </div>
      </section>

      <Separator className="bg-red-400/20" />

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-red-100/60 mb-4">
            Built on Aptos • Powered by AI • Secured by Blockchain
          </p>
          <p className="text-red-100/40 text-sm">
            © 2024 ArcheDAO Portal DApp. Revolutionizing decentralized
            governance.
          </p>
        </div>
      </footer>
    </div>
  );
}
