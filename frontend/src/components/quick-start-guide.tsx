"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Webhook, GitPullRequest, MessageSquare, Sparkles } from "lucide-react";

export function QuickStartGuide() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-400" />
          Quick Start Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
              <Webhook className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                1. Setup Webhook
              </h4>
              <p className="text-xs text-zinc-400">
                Configure webhook in your repository settings to enable automatic reviews
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/30">
              <GitPullRequest className="h-4 w-4 text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                2. Create Pull Request
              </h4>
              <p className="text-xs text-zinc-400">
                Open a PR and AI will automatically review your code changes
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/30">
              <MessageSquare className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                3. Interact & Learn
              </h4>
              <p className="text-xs text-zinc-400">
                Reply to AI comments, provide feedback, and help AI learn your preferences
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300 text-xs">
              ✨ Inline comments
            </Badge>
            <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300 text-xs">
              🐛 Bug detection
            </Badge>
            <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300 text-xs">
              🔒 Security checks
            </Badge>
            <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300 text-xs">
              💡 Best practices
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
