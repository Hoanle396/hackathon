# AI Code Reviewer

Hệ thống AI Code Reviewer tự động với khả năng học từ feedback, hiểu business context và review code chính xác.

## 🚀 Tính Năng

### Core Features
- ✅ **Đăng ký/Đăng nhập**: Xác thực người dùng với JWT
- ✅ **Quản lý Project**: Thêm, sửa, xóa projects từ GitHub/GitLab
- ✅ **GitHub/GitLab Token**: Cấu hình tokens để AI có thể comment
- ✅ **Business Context**: Cung cấp SRS, business logic cho AI
- ✅ **Auto Review**: Webhook tự động review khi có PR mới
- ✅ **AI Comment**: Comment trực tiếp lên PR với suggestions
- ✅ **Reply Comment**: AI có thể reply lại comments của users
- ✅ **Training từ Feedback**: Hệ thống học từ feedback để cải thiện

### Tech Stack

**Backend:**
- NestJS 10
- TypeORM + PostgreSQL
- JWT Authentication
- OpenAI / Anthropic AI
- GitHub & GitLab API Integration

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- React Hook Form
- Axios

## 📁 Cấu Trúc Project

```
ai/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/       # Authentication module
│   │   │   ├── user/       # User management
│   │   │   ├── project/    # Project management
│   │   │   ├── review/     # Review & comments
│   │   │   ├── webhook/    # GitHub/GitLab webhooks
│   │   │   ├── ai/         # AI service integration
│   │   │   └── training/   # Training data management
│   │   ├── config/         # Configuration
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── .env.example
│
└── frontend/               # Next.js Frontend
    ├── src/
    │   ├── app/           # App Router pages
    │   │   ├── dashboard/ # Dashboard pages
    │   │   ├── login/
    │   │   └── register/
    │   ├── components/    # React components
    │   ├── services/      # API services
    │   ├── store/         # Zustand stores
    │   └── lib/           # Utilities
    ├── package.json
    └── .env.local
```

## 🛠️ Cài Đặt

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm hoặc yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy .env.example to .env và điền thông tin
cp .env.example .env

# Chỉnh sửa .env với thông tin của bạn:
# - Database credentials
# - JWT secret
# - OpenAI/Anthropic API key

# Run migrations (nếu có)
npm run migration:run

# Start development server
npm run start:dev
```

Backend sẽ chạy tại: `http://localhost:3001`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy .env.local (đã có sẵn)
# Chỉnh sửa NEXT_PUBLIC_API_URL nếu cần

# Start development server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## 🔧 Cấu Hình

### 1. Database Setup

Tạo database PostgreSQL:

```sql
CREATE DATABASE ai_code_reviewer;
```

### 2. Environment Variables

**Backend (.env):**
```env
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=ai_code_reviewer

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d

OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

WEBHOOK_SECRET=your-webhook-secret
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 3. GitHub/GitLab Token

**GitHub Personal Access Token:**
1. Vào GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Chọn scopes: `repo`, `write:discussion`
4. Copy token và paste vào settings trong app

**GitLab Personal Access Token:**
1. Vào GitLab → Preferences → Access Tokens
2. Tạo token với scope: `api`, `read_api`, `write_repository`
3. Copy token và paste vào settings trong app

### 4. Webhook Setup

**GitHub:**
1. Vào Repository → Settings → Webhooks → Add webhook
2. Payload URL: `https://your-domain.com/api/v1/webhook/github`
3. Content type: `application/json`
4. Events: Select `Pull requests` và `Pull request review comments`

**GitLab:**
1. Vào Project → Settings → Webhooks
2. URL: `https://your-domain.com/api/v1/webhook/gitlab`
3. Trigger: `Merge request events`, `Comments`
4. Secret token: (optional)

## 📖 Sử Dụng

### 1. Đăng Ký & Đăng Nhập
- Truy cập `http://localhost:3000`
- Đăng ký tài khoản mới
- Đăng nhập với email/password

### 2. Cấu Hình Tokens
- Vào Settings
- Nhập GitHub/GitLab Personal Access Token
- Save tokens

### 3. Tạo Project
- Vào Dashboard → Add Project
- Nhập thông tin:
  - Tên project
  - Platform (GitHub/GitLab)
  - Repository URL
  - Business Context (mô tả về business logic)
- Enable Auto Review
- Save

### 4. Setup Webhook
- Copy webhook URL từ project details
- Configure webhook trên GitHub/GitLab
- Test webhook

### 5. Auto Review
- Tạo Pull Request trên GitHub/GitLab
- AI sẽ tự động review và comment
- Bạn có thể reply comment
- AI sẽ học từ feedback của bạn

## 🏗️ Database Schema

### Users
- id, email, password, fullName
- githubToken, gitlabToken
- isActive, createdAt, updatedAt

### Projects
- id, name, type (github/gitlab)
- repositoryUrl, webhookUrl, webhookSecret
- businessContext, reviewRules
- autoReview, isActive
- userId (foreign key)

### Reviews
- id, pullRequestId, pullRequestNumber
- pullRequestTitle, pullRequestUrl
- branch, author, status
- filesChanged, aiAnalysis
- projectId (foreign key)

### ReviewComments
- id, externalCommentId, type
- content, filePath, lineNumber
- author, parentCommentId
- isTrainingData, metadata
- reviewId (foreign key)

### TrainingData
- id, projectId, codeSnippet
- aiComment, userFeedback
- correctedComment, type
- context, useCount

## 🤖 AI Review Flow

1. **Webhook nhận PR event** → Tạo Review record
2. **Fetch file changes** → Lấy code diff
3. **Load business context** → Lấy SRS, rules từ project
4. **Load training data** → Lấy examples từ feedback trước
5. **Call AI API** → OpenAI/Anthropic review code
6. **Post comments** → Comment lên GitHub/GitLab
7. **Save comments** → Lưu vào database
8. **User feedback** → Học và cải thiện

## 🎯 Roadmap

- [ ] Support Bitbucket
- [ ] Custom AI models (fine-tuning)
- [ ] Code quality metrics dashboard
- [ ] Team collaboration features
- [ ] Slack/Discord notifications
- [ ] Multi-language support
- [ ] CI/CD integration

## 📝 API Documentation

### Authentication
- `POST /api/v1/auth/register` - Đăng ký
- `POST /api/v1/auth/login` - Đăng nhập
- `GET /api/v1/auth/profile` - Lấy profile
- `PUT /api/v1/auth/tokens` - Update tokens

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Tạo project
- `GET /api/v1/projects/:id` - Chi tiết project
- `PATCH /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Xóa project

### Webhooks
- `POST /api/v1/webhook/github` - GitHub webhook
- `POST /api/v1/webhook/gitlab` - GitLab webhook

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 👥 Authors

Your Name - AI Code Reviewer Team

## 🙏 Acknowledgments

- OpenAI for GPT API
- Anthropic for Claude API
- NestJS & Next.js communities

---

**Happy Coding! 🚀**
