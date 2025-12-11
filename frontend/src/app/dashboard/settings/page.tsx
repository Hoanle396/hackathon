'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService, UpdateTokensData } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth';
import { Key, Save } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, setValue } = useForm<UpdateTokensData>();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await authService.getProfile();
      updateUser(profile);
    } catch (error) {
      console.error('Failed to load profile');
    }
  };

  const onSubmit = async (data: UpdateTokensData) => {
    setLoading(true);
    try {
      await authService.updateTokens(data);
      toast.success('Cập nhật tokens thành công!');
      await loadProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Cài Đặt</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông Tin Tài Khoản</CardTitle>
            <CardDescription>Thông tin cá nhân của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Họ và tên</Label>
              <p className="text-sm text-gray-600 mt-1">{user?.fullName}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              <div>
                <CardTitle>API Tokens</CardTitle>
                <CardDescription>
                  Cấu hình tokens để AI có thể comment lên GitHub/GitLab
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="githubToken">
                  GitHub Personal Access Token
                  {user?.hasGithubToken && (
                    <span className="ml-2 text-xs text-green-600">✓ Đã cấu hình</span>
                  )}
                </Label>
                <Input
                  id="githubToken"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  {...register('githubToken')}
                />
                <p className="text-xs text-gray-500">
                  Tạo token tại: GitHub → Settings → Developer settings → Personal access tokens
                  <br />
                  Quyền cần: repo, write:discussion
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gitlabToken">
                  GitLab Personal Access Token
                  {user?.hasGitlabToken && (
                    <span className="ml-2 text-xs text-green-600">✓ Đã cấu hình</span>
                  )}
                </Label>
                <Input
                  id="gitlabToken"
                  type="password"
                  placeholder="glpat-xxxxxxxxxxxx"
                  {...register('gitlabToken')}
                />
                <p className="text-xs text-gray-500">
                  Tạo token tại: GitLab → Preferences → Access Tokens
                  <br />
                  Scope cần: api, read_api, write_repository
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discordBotToken">
                  Discord Bot Token
                  {user?.hasDiscordBotToken && (
                    <span className="ml-2 text-xs text-green-600">✓ Đã cấu hình</span>
                  )}
                </Label>
                <Input
                  id="discordBotToken"
                  type="password"
                  placeholder="your-discord-bot-token"
                  {...register('discordBotToken')}
                />
                <p className="text-xs text-gray-500">
                  Token bot Discord của bạn để gửi thông báo
                  <br />
                  Tạo bot tại: <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Discord Developer Portal</a>
                </p>
              </div>

              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Đang lưu...' : 'Lưu Tokens'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
