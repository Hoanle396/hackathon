"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ArrowRight,
  Webhook,
  Zap,
  BookOpen,
  Home,
} from "lucide-react";
import { WebhookSetupGuide } from "@/components/webhook-setup-guide";
import { QuickStartGuide } from "@/components/quick-start-guide";
import { cn } from "@/lib/utils";

export default function ProjectSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projectName, setProjectName] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");

  useEffect(() => {
    const name = searchParams.get("name") || "Your Project";
    const id = searchParams.get("id") || "";
    setProjectName(name);
    setProjectId(id);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 blur-xl opacity-50 animate-pulse"></div>
              <CheckCircle2 className="relative h-16 w-16 text-green-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Project Created Successfully!
          </h1>
          <p className="text-xl text-zinc-400">
            <span className="text-white font-semibold">{projectName}</span> is ready
            for AI-powered code reviews
          </p>
        </div>

        {/* Next Steps Card */}
        <Card className="bg-zinc-900/50 backdrop-blur-sm border-zinc-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-400" />
              Next Steps
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Complete these steps to start receiving AI code reviews
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Setup Webhook */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-400 border-blue-500/30 mt-1"
                >
                  Step 1
                </Badge>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Webhook className="h-5 w-5 text-blue-400" />
                    Configure Webhook
                  </h3>
                  <p className="text-sm text-zinc-400 mb-3">
                    Set up the webhook in your repository to enable automatic code
                    reviews for every Pull Request.
                  </p>
                  <WebhookSetupGuide
                    trigger={
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Webhook Setup Guide
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800"></div>

            {/* Step 2: Create PR */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-400 border-green-500/30 mt-1"
                >
                  Step 2
                </Badge>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Create a Pull Request
                  </h3>
                  <p className="text-sm text-zinc-400 mb-3">
                    Once the webhook is configured, create a Pull Request in your
                    repository. The AI will automatically review your code changes and
                    provide inline comments.
                  </p>
                  <div className="flex gap-2 text-xs text-zinc-500">
                    <span className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700">
                      ✅ Bug detection
                    </span>
                    <span className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700">
                      ✅ Security issues
                    </span>
                    <span className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700">
                      ✅ Best practices
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800"></div>

            {/* Step 3: Review Comments */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge
                  variant="outline"
                  className="bg-purple-500/10 text-purple-400 border-purple-500/30 mt-1"
                >
                  Step 3
                </Badge>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Review & Interact
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Review the AI comments on your Pull Request. You can reply to
                    comments, ask questions, or provide feedback. The AI will learn from
                    your interactions to improve future reviews.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}
            disabled={!projectId}
            size="lg"
            className={cn(
              "flex-1 bg-gradient-to-r from-white to-zinc-400 text-black font-semibold shadow-lg hover:shadow-xl hover:from-zinc-200 hover:to-zinc-500 transition-all duration-300"
            )}
          >
            View Project Details
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            size="lg"
            className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Additional Tips */}
        <Card className="bg-zinc-800/30 border-zinc-700">
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold text-zinc-300 mb-3">
              💡 Pro Tips:
            </h4>
            <ul className="text-sm text-zinc-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-zinc-500">•</span>
                <span>
                  Add business context in project settings to get more relevant reviews
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-500">•</span>
                <span>
                  Connect Discord for instant notifications on new reviews
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-500">•</span>
                <span>
                  Mention @ai-reviewer in comments to ask questions about your code
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
          </div>

          {/* Sidebar with Quick Start Guide */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <QuickStartGuide />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
