# Use Cases: Customer Intake Workflow

Các tình huống thực tế sử dụng workflow nhập liệu khách hàng từ name card / thông tin liên hệ.

**AI Agent:** Doanh Doanh (Telegram Bot)

---

## Use Case 1: Sự kiện networking — Lưu lead nhanh

**Tình huống:**
Anh Cường (CEO) tham dự hội thảo GBE AI Hub. Trong 3 giờ networking, anh gặp ~20 khách hàng tiềm năng, nhận được nhiều name card. Anh không có thời gian nhập từng contact vào CRM ngay tại sự kiện.

**Giải pháp:**
Anh Cường chụp ảnh từng name card và gửi cho Doanh Doanh qua Telegram.

**Input:**
```
[Ảnh name card]
```

**Doanh Doanh xử lý:**
1. OCR → Extract: Nguyễn Văn A, 0901234567, a.nguyen@techcorp.vn, TechCorp Solutions, CTO, techcorp.vn
2. Dedup → Không tìm thấy contact trùng
3. Tạo contact mới trong Bitrix24
4. Tạo activity follow-up cho Quỳnh, deadline ngày mai 17h
5. Hỏi thêm: "Tạo deal cho contact này không?"

**Kết quả:**
- 20 contacts được lưu trong 10 phút (thay vì 1 giờ nhập tay)
- Mỗi contact có activity reminder để follow-up
- Không bỏ sót lead nào

---

## Use Case 2: Nhận giới thiệu qua chat — Forward tin nhắn

**Tình huống:**
Anh Cường nhận được tin nhắn Zalo từ khách hàng cũ giới thiệu 1 người bạn cần dịch vụ. Anh forward nội dung cho Doanh Doanh qua Telegram.

**Input:**
```
Chị ơi, em giới thiệu anh Tuấn bên công ty ABC cho chị nhé:
- Anh Trần Minh Tuấn
- SĐT: 0987 654 321
- Email: tuan.tran@abc.com.vn
- Công ty ABC Trading
- Chức vụ: Giám đốc kinh doanh
Anh ấy đang cần tư vấn giải pháp automation, chị liên hệ sớm nhé!
```

**Doanh Doanh xử lý:**
1. Parse text → Extract thông tin
2. Dedup → Check SĐT/Email → Không trùng
3. Tạo contact: Trần Minh Tuấn
4. Tạo activity: "Follow up: Trần Minh Tuấn" - deadline +1 ngày làm việc
5. Hỏi: "Tạo deal cho contact này không? (Nếu có, cho biết tên deal và giá trị ước tính)"

**Anh Cường trả lời:**
```
Tạo deal "Tư vấn Automation - ABC Trading", ước tính 50 triệu
```

**Doanh Doanh tiếp tục:**
- Tạo deal với title, amount, link contact
- Confirm: "Đã tạo deal D_325 và link với contact Trần Minh Tuấn"

---

## Use Case 3: Khách hàng cũ quay lại — Dedup hoạt động

**Tình huống:**
Anh Cường gặp lại khách hàng cũ tại triển lãm, nhận name card mới (khách đã đổi công ty). Anh gửi ảnh cho Doanh Doanh qua Telegram.

**Input:**
```
[Ảnh name card]
Lê Thị Hương - 0912345678 - huong.le@newcompany.vn - New Company JSC - Marketing Director
```

**Doanh Doanh xử lý:**
1. OCR → Extract info
2. Dedup → **Tìm thấy contact "Lê Thị Hương" với SĐT 0912345678**
3. Hỏi anh Cường: "Tìm thấy contact Lê Thị Hương (ID: 156) với SĐT 0912345678. Liên kết với contact này hay tạo mới?"

**Anh Cường trả lời:**
```
Liên kết, update email và company mới
```

**Doanh Doanh tiếp tục:**
- Update contact 156: email = huong.le@newcompany.vn, company = New Company JSC
- Tạo activity follow-up
- Confirm: "Đã update contact và tạo activity follow-up"

---

## Use Case 4: Batch import — Sau sự kiện

**Tình huống:**
Sau hội thảo GBE AI Hub, anh Cường có 50 ảnh name card trong điện thoại. Anh gửi lần lượt cho Doanh Doanh qua Telegram.

**Input:**
```
[Ảnh 1] [Ảnh 2] [Ảnh 3] ... [Ảnh 50]
Nhập hết name card này vào CRM, assign cho Tú follow-up
```

**Doanh Doanh xử lý:**
- Lặp qua từng ảnh: OCR → Dedup → Create/Link → Activity
- Tất cả activity assign cho Tú (ID 30)
- Báo cáo: "Đã nhập 48/50 contacts. 2 contacts trùng đã link với contact có sẵn."

---

## Use Case 5: Khách hàng gửi thông tin qua form/email

**Tình huống:**
Khách điền form trên website, thông tin được forward cho Doanh Doanh qua Telegram.

**Input:**
```
New lead from website:
Name: Phạm Văn Bình
Phone: 028 1234 5678
Email: binh@startup.io
Company: Startup.io
Position: Founder
Website: https://startup.io
Message: Tôi muốn tìm hiểu về giải pháp CRM cho startup
```

**Doanh Doanh xử lý:**
1. Parse → Extract all fields including website
2. Dedup → OK
3. Create contact với đầy đủ thông tin
4. Tạo activity với description chứa message của khách
5. Hỏi: "Tạo deal cho contact này không?"

---

## Use Case 6: Tạo task thay vì activity

**Tình huống:**
Anh Cường muốn tạo task cụ thể cho Tú thay vì activity reminder đơn giản.

**Input:**
```
[Ảnh name card]
Tạo task gọi điện tư vấn cho khách này, assign Tú, deadline thứ 5 lúc 10h sáng
```

**Doanh Doanh xử lý:**
1. OCR → Extract info
2. Dedup → Create contact
3. Vì anh Cường nói "tạo task" → Dùng `bitrix24_create_task` (không phải activity)
4. Task: "Gọi điện tư vấn cho [Tên khách]", responsibleId: 30 (Tú), deadline: 2026-04-17T10:00:00+07:00, crmEntities: ["C_xxx"]

---

## Tổng kết lợi ích

| Trước | Sau khi dùng workflow |
|-------|----------------------|
| Nhập tay ~3 phút/contact | OCR tự động ~10 giây/contact |
| Quên follow-up | Activity/Task tự động với deadline |
| Trùng lặp contact | Dedup check trước khi tạo |
| Thiếu thông tin | Extract đầy đủ: name, phone, email, company, position, website |
| Không biết assign ai | Default Quỳnh hoặc chỉ định người khác |

---

## Trigger phrases (Vietnamese)

Doanh Doanh nhận diện workflow này khi anh Cường:
- Gửi ảnh name card
- "Lưu contact này"
- "Thêm khách hàng mới"
- "Nhập thông tin khách"
- Forward tin nhắn chứa thông tin liên hệ
- "Save contact [tên]"
