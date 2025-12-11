'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { projectService, UpdateProjectData, Project } from '@/services/project.service';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<UpdateProjectData>();

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const data = await projectService.getById(projectId);
      setProject(data);
      
      // Set form values
      setValue('name', data.name);
      setValue('businessContext', data.businessContext || '');
      setValue('autoReview', data.autoReview);
      setValue('isActive', data.isActive);
      setValue('discordChannelId', data.discordChannelId || '');
    } catch (error: any) {
      toast.error('Không thể tải thông tin project');
      router.push('/dashboard');
    }
  };

  const onSubmit = async (data: UpdateProjectData) => {
    setLoading(true);
    try {
      await projectService.update(projectId, data);
      toast.success('Cập nhật project thành công!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật project thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa project này?')) {
      return;
    }

    setDeleting(true);
    try {
      await projectService.delete(projectId);
      toast.success('Xóa project thành công!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xóa project thất bại');
    } finally {
      setDeleting(false);
    }
  };

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-center text-gray-500">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Chỉnh Sửa Project</CardTitle>
          <CardDescription>
            Cập nhật thông tin project {project.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên Project *</Label>
              <Input
                id="name"
                placeholder="My Awesome Project"
                {...register('name', { required: 'Tên project là bắt buộc' })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Platform</Label>
              <p className="text-sm text-gray-600">
                {project.type === 'github' ? '🐙 GitHub' : '🦊 GitLab'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Repository URL</Label>
              <p className="text-sm text-gray-600 truncate">{project.repositoryUrl}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessContext">Business Context</Label>
              <Textarea
                id="businessContext"
                placeholder="Mô tả về business logic, quy chuẩn, những điều AI cần biết về dự án..."
                rows={5}
                {...register('businessContext')}
              />
              <p className="text-xs text-gray-500">
                Cung cấp thông tin về dự án để AI review chính xác hơn
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discordChannelId">Discord Channel ID (Optional)</Label>
              <Input
                id="discordChannelId"
                placeholder="1234567890123456789"
                {...register('discordChannelId')}
              />
              <p className="text-xs text-gray-500">
                Nhập Channel ID của Discord để nhận thông báo về PR và review (cần cài đặt bot trước)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="autoReview"
                type="checkbox"
                {...register('autoReview')}
                className="h-4 w-4"
              />
              <Label htmlFor="autoReview" className="cursor-pointer">
                Bật auto review (AI sẽ tự động review mỗi pull request)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="isActive"
                type="checkbox"
                {...register('isActive')}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Project đang hoạt động
              </Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Đang cập nhật...' : 'Cập Nhật'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Hủy
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-red-600 mb-2">Vùng nguy hiểm</h3>
            <p className="text-sm text-gray-600 mb-4">
              Xóa project sẽ xóa tất cả dữ liệu liên quan bao gồm reviews và comments. Hành động này không thể hoàn tác.
            </p>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Đang xóa...' : 'Xóa Project'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
