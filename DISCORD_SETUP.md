# Discord Integration

Discord bot để nhận thông báo và tương tác với AI Code Reviewer.

## 🚀 Setup Discord Bot

### 1. Tạo Discord Bot

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → Đặt tên cho bot
3. Vào tab **Bot** → Click **Add Bot**
4. Bật các **Privileged Gateway Intents**:
   - ✅ MESSAGE CONTENT INTENT
   - ✅ SERVER MEMBERS INTENT
5. Copy **Bot Token** (sẽ dùng trong `.env`)

### 2. Mời Bot vào Server

1. Vào tab **OAuth2** → **URL Generator**
2. Chọn **Scopes**:
   - ✅ bot
   - ✅ applications.commands
3. Chọn **Bot Permissions**:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Read Message History
   - ✅ Add Reactions
   - ✅ Use Slash Commands
4. Copy URL và mở trong browser để thêm bot vào server

### 3. Lấy Channel ID

1. Bật **Developer Mode** trong Discord:
   - Settings → Advanced → Developer Mode
2. Right-click vào channel muốn nhận notification → **Copy ID**
3. Lưu Channel ID này để cấu hình trong Project

### 4. Cấu hình Backend

Thêm vào file `.env`:

```env
# Discord
DISCORD_ENABLED=true
```

### 5. Cấu hình Bot Token cho User

Mỗi user cần cấu hình Discord bot token riêng:

1. Truy cập **Settings** trong dashboard
2. Nhập **Discord Bot Token** của bạn
3. Click **Lưu Tokens**

### 6. Cấu hình Channel cho Project

Discord channel được cấu hình riêng cho từng project:

1. Khi tạo hoặc chỉnh sửa project, nhập **Discord Channel ID** vào form
2. Mỗi project có thể có channel riêng để nhận thông báo
3. Nếu không cấu hình channel ID, project sẽ không gửi Discord notifications

## 📝 Commands

Bot hỗ trợ các commands sau:

### `!context`
Hiển thị thông tin về AI Code Reviewer system và trạng thái hiện tại.

```
!context
```

### `!pr <number>`
Kiểm tra trạng thái review của một Pull Request cụ thể.

```
!pr 123
```

### `!help`
Hiển thị danh sách tất cả commands có sẵn.

```
!help
```

## ✨ Lưu ý

- **Mỗi user cần có Discord bot riêng**: Không dùng chung bot token
- **Mỗi project có thể có channel riêng**: Linh hoạt trong việc quản lý thông báo
- **Bot token được lưu mã hóa**: An toàn và bảo mật

## 📑 Notifications

Bot tự động gửi notifications cho:

### 1. **New Pull Request**
- Thông báo @here khi có PR mới
- Hiển thị thông tin: Project, Author, Branch, Files changed
- Buttons để view PR và AI review

### 2. **Review Complete**
- Thông báo khi AI review hoàn thành
- Hiển thị số lượng comments
- Link đến PR và review results

### 3. **Review Failed**
- Thông báo nếu AI review gặp lỗi
- Giúp team biết để xử lý thủ công

## 🎨 Message Format

### Pull Request Notification
```
@here New PR ready for review! 🚀

🔔 New Pull Request: [PR Title]
━━━━━━━━━━━━━━━━━━━━━

📦 Project: MyProject
👤 Author: johndoe
🌿 Branch: feature/new-feature
📄 Files Changed: 5
➕ Additions: +120
➖ Deletions: -30

[View Pull Request] [View AI Review]
```

### Review Complete
```
✅ AI Review Complete

📦 Project: MyProject
📝 PR: Implement new feature
💬 Comments: 8
```

## 🔧 Customization

### Thay đổi Channel

Update `DISCORD_CHANNEL_ID` trong `.env` để gửi notifications đến channel khác.

### Disable Discord

Set `DISCORD_ENABLED=false` để tắt Discord integration.

### Custom Messages

Chỉnh sửa `discord.service.ts` để customize format messages, colors, và embeds.

## 📊 Features

- ✅ Real-time notifications cho PR events
- ✅ Interactive buttons để navigate
- ✅ Rich embeds với colors và formatting
- ✅ Bot commands để query information
- ✅ Context-aware responses
- ✅ Error handling và logging

## 🐛 Troubleshooting

### Bot không online?
- Kiểm tra `DISCORD_BOT_TOKEN` đúng chưa
- Kiểm tra logs trong terminal: `pnpm start:dev`

### Không nhận notification?
- Kiểm tra `DISCORD_CHANNEL_ID` đúng chưa
- Kiểm tra bot có quyền post messages trong channel không
- Kiểm tra `DISCORD_ENABLED=true`

### Commands không hoạt động?
- Kiểm tra bot có quyền đọc messages không
- Kiểm tra **MESSAGE CONTENT INTENT** đã bật chưa

## 📚 Example Usage

1. **Setup bot theo hướng dẫn trên**
2. **Start backend**: `pnpm start:dev`
3. **Tạo PR trên GitHub/GitLab**
4. **Bot tự động gửi notification vào Discord**
5. **Dùng commands để interact với bot**

---

**Note**: Bot chỉ hoạt động khi backend đang chạy. Để bot hoạt động 24/7, cần deploy backend lên server.
