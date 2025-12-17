"use client";

import { useState } from "react";
import { useRouter } from "@bprogress/next/app";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Rocket, Crown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BackgroundLines } from "@/components/ui/background-lines";

type BillingCycle = "MONTHLY" | "YEARLY";

const plans = [
  {
    name: "FREE",
    price: 0,
    icon: Zap,
    features: [
      "1 project",
      "1 team member",
      "100 AI reviews / month",
      "GitHub & GitLab integration",
      "Basic AI code review",
      "Community support",
    ],
  },
  {
    name: "STARTER",
    price: 29,
    icon: Rocket,
    features: [
      "5 projects",
      "5 team members",
      "1,000 AI reviews / month",
      "Advanced AI review",
      "Custom rules",
      "Priority support",
    ],
  },
  {
    name: "PRO",
    price: 99,
    icon: Crown,
    popular: true,
    features: [
      "20 projects",
      "20 team members",
      "5,000 AI reviews / month",
      "AI learning from feedback",
      "API access",
      "Advanced analytics",
      "24/7 support",
    ],
  },
  {
    name: "ENTERPRISE",
    price: 299,
    icon: Building2,
    features: [
      "Unlimited projects",
      "Unlimited members",
      "Unlimited reviews",
      "Dedicated AI model",
      "On-premise deployment",
      "SLA & account manager",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");

  const priceLabel = (price: number) => {
    if (price === 0) return "Free";
    if (cycle === "MONTHLY") return `$${price}/mo`;
    return `$${Math.floor(price * 12 * 0.8)}/yr`;
  };

  return (
    <BackgroundLines>
      <div className="min-h-screen bg-black text-zinc-200 px-4 pt-28 pb-32">
        {/* Background */}
        <div className="absolute inset-0  pointer-events-none" />

        <div className="relative max-w-7xl mx-auto min-h-screen">
          {/* Header */}
          <div className="text-center mb-20">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent">
              Pricing built for teams
            </h1>
            <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
              Start free. Upgrade when your workflow grows. No hidden fees.
            </p>

            {/* Billing toggle */}
            <div className="mt-10 inline-flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              {(["MONTHLY", "YEARLY"] as BillingCycle[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setCycle(item)}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-medium transition",
                    cycle === item
                      ? "bg-emerald-400 text-black shadow-lg shadow-emerald-500/30"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-300"
                  )}
                >
                  {item === "MONTHLY" ? "Monthly" : "Yearly"}
                  {item === "YEARLY" && (
                    <Badge className="ml-2 bg-zinc-700 text-white border-none">
                      -20%
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;

              return (
                <Card
                  key={plan.name}
                  className={cn(
                    "bg-zinc-900/70 border rounded-2xl flex flex-col transition-all duration-300 hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-1",
                    plan.popular &&
                    "border-emerald-400/50 shadow-xl shadow-emerald-500/30"
                  )}
                >
                  {/* Header */}
                  <CardHeader className="text-center space-y-4">
                    <Icon className="mx-auto h-10 w-10 text-zinc-200" />

                    <CardTitle className="text-xl text-white">
                      {plan.name}
                    </CardTitle>

                    <div>
                      <div className="text-4xl font-bold text-white">
                        {priceLabel(plan.price)}
                      </div>
                      {cycle === "YEARLY" && plan.price > 0 && (
                        <p className="text-xs text-zinc-500 mt-1">
                          billed yearly
                        </p>
                      )}
                    </div>

                    {plan.popular && (
                      <Badge className="mx-auto bg-emerald-400 text-black font-semibold">
                        Most Popular
                      </Badge>
                    )}
                  </CardHeader>

                  {/* Content */}
                  <CardContent className="flex flex-col flex-1 px-6">
                    {/* Features */}
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex gap-2 text-sm">
                          <Check className="h-4 w-4 text-white mt-0.5" />
                          <span className="text-zinc-300">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      onClick={() => router.push("/dashboard/billing")}
                      className={cn(
                        "mt-8 w-full rounded-xl py-2.5 font-semibold transition-all duration-300",
                        plan.popular
                          ? "bg-emerald-400 text-black hover:bg-emerald-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 hover:scale-[1.02]"
                          : "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700 hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/20"
                      )}
                    >
                      {plan.price === 0 ? "Start for Free" : "Choose Plan"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </BackgroundLines>
  );
}
