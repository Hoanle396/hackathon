"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth";
import { BackgroundLines } from "@/components/ui/background-lines";
import { useRouter } from "@bprogress/next/app";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const response = await authService.login(data);
      setAuth(response.user, response.access_token);
      toast.success("Login successful!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundBeamsWithCollision>
      <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-black px-4 text-white">
        <Card className="w-full max-w-md bg-zinc-900/90 border border-emerald-400/30 backdrop-blur-xl shadow-2xl shadow-emerald-500/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>

            <CardDescription className="text-zinc-400 text-sm">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-300"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-300"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                {errors.password && (
                  <p className="text-sm text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-emerald-400 text-black font-semibold hover:bg-emerald-300 transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-zinc-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-emerald-400 underline hover:text-emerald-300 transition-all duration-300"
              >
                Sign up now
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </BackgroundBeamsWithCollision>
  );
}
