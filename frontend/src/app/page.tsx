'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            AI Code Reviewer
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Hệ thống review code tự động với AI. Hiểu business context, phát hiện lỗi chính xác, 
            và học từ feedback của bạn.
          </p>
          
          <div className="flex gap-4 justify-center mb-16">
            <Button size="lg" onClick={() => router.push('/login')}>
              Đăng nhập
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/register')}>
              Đăng ký miễn phí
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI Review Thông Minh</h3>
              <p className="text-gray-600">
                AI hiểu business context và review code theo đúng quy chuẩn của dự án
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold mb-2">Tự Động Hóa</h3>
              <p className="text-gray-600">
                Webhook tự động review mỗi pull request, comment ngay lập tức
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">Học & Cải Thiện</h3>
              <p className="text-gray-600">
                AI học từ feedback của bạn, ngày càng review chính xác hơn
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
