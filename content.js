/* Nội dung bài giảng: 5 phần. Mã Java dùng String.raw để giữ nguyên dấu \ */
const R = String.raw;

const SECTIONS = [
/* ============================ PHẦN 1 ============================ */
{
  id: 's1', num: 1, title: 'Rẽ nhánh if – else', short: 'If – else', glyph: 'if', minutes: 25, hue: 262,
  blurb: 'Chọn nhánh chạy theo điều kiện, nắm đoản mạch && và ||, viết if gọn bằng guard clause.',
  tags: ['Điều kiện', 'Guard clause', 'Đoản mạch'],
  lesson: [
    { t: 'h', x: 'if, else if, else' },
    { t: 'p', x: 'Điều kiện trong `if` bắt buộc là **boolean** (không dùng 0/1 như C). Các nhánh được kiểm tra **từ trên xuống**; nhánh đầu tiên đúng sẽ chạy và **các nhánh còn lại bị bỏ qua**. Vì vậy điều kiện hẹp, cụ thể phải đặt trước.' },
    { t: 'demo', title: 'Xếp loại theo điểm', fn: 'xepLoai', args: ['7.0'], argNames: ['diem'],
      note: 'Bấm ▶ để xem từng dòng chạy. Đổi diem thành 9, 5, 3 rồi chạy lại: nhánh nào được chọn?',
      code: R`static String xepLoai(double diem) {
    if (diem >= 8.0) {
        return "Giỏi";
    } else if (diem >= 6.5) {
        return "Khá";
    } else if (diem >= 5.0) {
        return "Trung bình";
    } else {
        return "Yếu";
    }
}` },
    { t: 'h', x: 'Đoản mạch && và ||' },
    { t: 'p', x: '`&&`: nếu vế trái **false** thì Java dừng ngay, không tính vế phải. `||`: nếu vế trái **true** thì dừng. Đây là công cụ bảo vệ chống `NullPointerException`: luôn kiểm tra `null` **trước**.' },
    { t: 'demo', title: 'Kiểm tra null trước, rồi mới dùng', fn: 'tenHopLe', args: ['null'], argNames: ['ten'],
      note: 'Thử: bấm “Sửa code”, đổi thành `ten.isEmpty() || ten == null` rồi chạy với ten = null. Chuyện gì xảy ra?',
      code: R`static boolean tenHopLe(String ten) {
    if (ten == null || ten.isEmpty()) {
        return false;
    }
    return true;
}` },
    { t: 'h', x: 'Toán tử ba ngôi' },
    { t: 'p', x: '`điều_kiện ? giá_trị_nếu_đúng : giá_trị_nếu_sai` dùng để gán nhanh một giá trị. Không lồng nhiều tầng vì rất khó đọc.' },
    { t: 'demo', title: 'Đạt / Không đạt', fn: 'ketQua', args: ['6.5'], argNames: ['diem'],
      code: R`static String ketQua(double diem) {
    String s = (diem >= 5.0) ? "Đạt" : "Không đạt";
    return s;
}` },
    { t: 'h', x: 'Guard clause: viết if “phẳng”' },
    { t: 'p', x: 'Thay vì lồng nhiều tầng `if`, hãy **kiểm tra điều kiện sai trước rồi `return` sớm**. Code ngắn hơn, ít thụt lề, dễ đọc. Đây là cách viết bạn sẽ dùng rất nhiều khi kiểm tra dữ liệu trong class (OOP).' },
    { t: 'code', code: R`// Chưa gọn: lồng 3 tầng
double tinhTien(double gia, boolean coMa, boolean hetHan) {
    if (gia > 0) {
        if (!hetHan) {
            if (coMa) { return gia * 0.8; }
            return gia * 0.95;
        }
    }
    return gia;   // gia <= 0 mà cũng trả về gia: dễ sai!
}` },
    { t: 'demo', title: 'Bản dùng guard clause', fn: 'tinhTien', args: ['100', 'true', 'false'], argNames: ['gia', 'coMa', 'hetHan'],
      code: R`static double tinhTien(double gia, boolean coMa, boolean hetHan) {
    if (gia <= 0) return 0.0;
    if (hetHan) return gia;
    return coMa ? gia * 0.8 : gia * 0.95;
}` },
    { t: 'h', x: 'Bốn cạm bẫy kinh điển' },
    { t: 'table', head: ['Lỗi', 'Ví dụ sai', 'Cách đúng'], rows: [
      ['Nhầm `=` với `==`', '`if (x = 5)`', '`if (x == 5)`'],
      ['Dấu `;` thừa sau if', '`if (x > 0);`', '`if (x > 0) { ... }`'],
      ['Viết kiểu toán học', '`0 <= x <= 10`', '`x >= 0 && x <= 10`'],
      ['So sánh số thực bằng `==`', '`a == b` (double)', '`Math.abs(a - b) < 1e-9`'],
    ] },
    { t: 'play', title: 'Thử ngay: số thực và toán tử', vars: {}, hint: 'Sửa biểu thức trong ô rồi nhấn Enter.',
      rows: ['0.1 + 0.2', '0.1 + 0.2 == 0.3', 'Math.abs(0.1 + 0.2 - 0.3) < 1e-9', '5 / 2', '5 / 2.0', '5 % 2', '(5 > 3) && (2 > 4)', '!(5 > 3)'] },
  ],
  exercises: [
    { id: 's1-e1', type: 'predict', level: 1, title: 'Nhánh nào được chạy?',
      q: 'Đoạn code in ra gì?',
      code: R`static void demo() {
    int x = 15;
    if (x > 5) System.out.println("A");
    else if (x > 10) System.out.println("B");
    else System.out.println("C");
}`,
      run: { fn: 'demo', args: [] }, choices: ['A', 'B', 'C', 'A rồi B'], answer: 0, check: 'A',
      explain: 'x = 15 thỏa `x > 5` ngay nhánh đầu tiên, nên in A và **bỏ qua mọi nhánh còn lại** (first-match-exit), dù `x > 10` cũng đúng.' },
    { id: 's1-e2', type: 'bug', level: 1, title: 'Bắt lỗi biên dịch',
      prompt: 'Đoạn code có **2 lỗi** khiến không biên dịch được. Bấm vào các dòng bị lỗi rồi nhấn “Nộp bài”.',
      code: R`static String phanLoai(int tuoi, double diem) {
    if (tuoi = 18) {
        return "Vua du 18";
    }
    if (0 <= diem <= 10) {
        return "Diem hop le";
    }
    return "Khac";
}`,
      bugs: { 2: 'Dùng `=` (phép gán) thay vì `==` (so sánh). Điều kiện của if phải là boolean.', 5: 'Java không cho viết `0 <= diem <= 10`. Phải viết `diem >= 0 && diem <= 10`.' },
      hints: ['Một lỗi nằm ở dòng có dấu `=` trong điều kiện.', 'Lỗi còn lại là cách viết khoảng giá trị kiểu toán học.'] },
    { id: 's1-e3', type: 'bug', level: 2, title: 'Bắt lỗi logic ẩn',
      prompt: 'Code biên dịch được nhưng có **3 lỗi** gây sai kết quả hoặc làm chương trình sập. Tìm cả ba.',
      code: R`static String kiemTra(String ten, double diem) {
    if (ten.isEmpty() || ten == null) {
        return "Thieu ten";
    }
    if (diem == 0.1 + 0.2) {
        return "Bang 0.3";
    }
    if (ten.length() > 3);
        return "Ten hop le";
    return "Ten qua ngan";
}`,
      bugs: { 2: 'Đặt `ten.isEmpty()` trước `ten == null`: nếu ten là null sẽ ném NullPointerException. Phải kiểm tra null trước nhờ đoản mạch.', 5: 'So sánh số thực bằng `==`: 0.1 + 0.2 không đúng bằng 0.3. Dùng epsilon: `Math.abs(diem - 0.3) < 1e-9`.', 8: 'Dấu `;` ngay sau if khiến if kết thúc ngay, dòng `return "Ten hop le"` luôn luôn chạy.' },
      hints: ['Hãy nghĩ điều gì xảy ra khi ten = null.', 'Có một lỗi liên quan đến số thực, một lỗi là ký tự thừa ở cuối dòng.'] },
    { id: 's1-e4', type: 'code', level: 1, title: 'Năm nhuận', fn: 'laNamNhuan',
      prompt: 'Viết phương thức trả về `true` nếu `year` là năm nhuận: chia hết cho 4 **nhưng không** chia hết cho 100, **hoặc** chia hết cho 400.',
      starter: R`static boolean laNamNhuan(int year) {
    // viết code ở đây

}`,
      tests: [{ a: ['2024'], e: 'true' }, { a: ['2023'], e: 'false' }, { a: ['1900'], e: 'false' }, { a: ['2000'], e: 'true' }, { a: ['2100'], e: 'false', hide: 1 }, { a: ['1600'], e: 'true', hide: 1 }, { a: ['4'], e: 'true', hide: 1 }],
      hints: ['Dùng toán tử `%` để kiểm tra chia hết: `year % 4 == 0`.', 'Kết hợp: `(chia hết 4 && không chia hết 100) || chia hết 400`.'],
      solution: R`static boolean laNamNhuan(int year) {
    return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
}` },
    { id: 's1-e5', type: 'code', level: 2, title: 'Ba cạnh tam giác (guard clause)', fn: 'laTamGiac',
      prompt: 'Trả về `true` nếu `a, b, c` là ba cạnh của một tam giác hợp lệ (cả ba > 0 và tổng hai cạnh bất kỳ **lớn hơn** cạnh còn lại). **Bắt buộc dùng guard clause: không dùng `else`.**',
      starter: R`static boolean laTamGiac(double a, double b, double c) {

}`,
      rules: [{ forbid: R`\belse\b`, msg: 'Bài này yêu cầu dùng guard clause (return sớm), không dùng else.' }],
      tests: [{ a: ['3', '4', '5'], e: 'true' }, { a: ['1', '1', '3'], e: 'false' }, { a: ['0', '4', '5'], e: 'false' }, { a: ['-1', '2', '2'], e: 'false' }, { a: ['5', '5', '5'], e: 'true' }, { a: ['1', '2', '3'], e: 'false', hide: 1 }, { a: ['2', '2', '3.5'], e: 'true', hide: 1 }],
      hints: ['Bắt đầu bằng: nếu có cạnh <= 0 thì `return false;`.', 'Tiếp theo kiểm tra từng bất đẳng thức, mỗi cái một `if ... return false;`. Cuối cùng `return true;`.'],
      solution: R`static boolean laTamGiac(double a, double b, double c) {
    if (a <= 0 || b <= 0 || c <= 0) return false;
    if (a + b <= c) return false;
    if (a + c <= b) return false;
    if (b + c <= a) return false;
    return true;
}` },
    { id: 's1-e6', type: 'code', level: 2, title: 'Xếp loại học lực', fn: 'xepLoai',
      prompt: 'Trả về xếp loại theo `diem`: từ 8 trở lên `"GIOI"`; từ 6.5 `"KHA"`; từ 5 `"TB"`; còn lại `"YEU"`. Điểm ngoài khoảng 0..10 trả về `"KHONG HOP LE"`.',
      starter: R`static String xepLoai(double diem) {

}`,
      tests: [{ a: ['9.0'], e: '"GIOI"' }, { a: ['8.0'], e: '"GIOI"' }, { a: ['7.5'], e: '"KHA"' }, { a: ['6.5'], e: '"KHA"' }, { a: ['5.0'], e: '"TB"' }, { a: ['4.9'], e: '"YEU"' }, { a: ['0'], e: '"YEU"', hide: 1 }, { a: ['10'], e: '"GIOI"', hide: 1 }, { a: ['-1'], e: '"KHONG HOP LE"' }, { a: ['10.5'], e: '"KHONG HOP LE"', hide: 1 }],
      hints: ['Kiểm tra điểm không hợp lệ trước (guard clause).', 'Sau đó xếp từ ngưỡng cao xuống thấp bằng else if.'],
      solution: R`static String xepLoai(double diem) {
    if (diem < 0 || diem > 10) return "KHONG HOP LE";
    if (diem >= 8) return "GIOI";
    if (diem >= 6.5) return "KHA";
    if (diem >= 5) return "TB";
    return "YEU";
}` },
    { id: 's1-e7', type: 'order', level: 2, title: 'Sắp xếp guard clause',
      prompt: 'Kéo (hoặc dùng nút ↑↓) để sắp xếp đúng phương thức. Quy tắc: giá ≤ 0 thì trả về 0.0; hết hạn thì giữ nguyên giá; còn lại có mã giảm 20%, không có mã giảm 5%.',
      lines: [
        'static double tinhTien(double gia, boolean coMa, boolean hetHan) {',
        '    if (gia <= 0) {',
        '        return 0.0;',
        '    }',
        '    if (hetHan) {',
        '        return gia;',
        '    }',
        '    return coMa ? gia * 0.8 : gia * 0.95;',
        '}'],
      hints: ['Dòng khai báo phương thức luôn đứng đầu, dấu `}` cuối cùng đứng cuối.', 'Kiểm tra giá ≤ 0 trước tiên, rồi mới đến hết hạn.'] },
    { id: 's1-e8', type: 'code', level: 3, title: 'Thử thách: số nghiệm phương trình bậc 2', fn: 'soNghiem',
      prompt: 'Trả về số nghiệm thực của `ax² + bx + c = 0`: `0`, `1` hoặc `2`; riêng trường hợp vô số nghiệm trả về `-1`. Chú ý `a = 0` (phương trình bậc nhất) và so sánh số thực bằng epsilon `1e-9`.',
      starter: R`static int soNghiem(double a, double b, double c) {

}`,
      tests: [{ a: ['1', '-3', '2'], e: '2' }, { a: ['1', '2', '1'], e: '1' }, { a: ['1', '0', '1'], e: '0' }, { a: ['0', '2', '-4'], e: '1' }, { a: ['0', '0', '5'], e: '0' }, { a: ['0', '0', '0'], e: '-1' }, { a: ['2', '4', '2'], e: '1', hide: 1 }, { a: ['1', '0', '-4'], e: '2', hide: 1 }],
      hints: ['Nếu |a| < 1e-9 thì đây là phương trình bậc nhất bx + c = 0.', 'Với a ≠ 0, tính delta = b*b - 4*a*c rồi so sánh với 0 (có epsilon).'],
      solution: R`static int soNghiem(double a, double b, double c) {
    if (Math.abs(a) < 1e-9) {
        if (Math.abs(b) < 1e-9) {
            return Math.abs(c) < 1e-9 ? -1 : 0;
        }
        return 1;
    }
    double delta = b * b - 4 * a * c;
    if (delta < -1e-9) return 0;
    if (Math.abs(delta) < 1e-9) return 1;
    return 2;
}` },
  ],
},

/* ============================ PHẦN 2 ============================ */
{
  id: 's2', num: 2, title: 'switch – case', short: 'switch', glyph: 'switch', minutes: 20, hue: 178,
  blurb: 'So khớp một giá trị với nhiều hằng số: switch cổ điển, fall-through và switch expression hiện đại.',
  tags: ['break', 'Fall-through', 'Java 14+'],
  lesson: [
    { t: 'h', x: 'Switch cổ điển' },
    { t: 'p', x: '`switch` so khớp một giá trị với các **hằng số rời rạc**. Kiểu được hỗ trợ: `byte, short, char, int, String` và `enum`. **Không** hỗ trợ `long, float, double, boolean`. Mỗi `case` thường kết thúc bằng `break`.' },
    { t: 'demo', title: 'Thứ trong tuần', fn: 'thuTrongTuan', args: ['3'], argNames: ['day'],
      note: 'Đổi day thành 7 hoặc 9 để thấy nhánh default.',
      code: R`static String thuTrongTuan(int day) {
    String ten;
    switch (day) {
        case 1: ten = "Thứ hai"; break;
        case 2: ten = "Thứ ba"; break;
        case 3: ten = "Thứ tư"; break;
        default: ten = "Không rõ";
    }
    return ten;
}` },
    { t: 'h', x: 'Fall-through: quên break' },
    { t: 'p', x: 'Nếu thiếu `break`, luồng chạy **trôi xuống các case phía dưới** mà không kiểm tra lại điều kiện. Đây là lỗi rất hay gặp. Ngược lại, có thể tận dụng có chủ ý để gộp nhiều case chung một xử lý.' },
    { t: 'demo', title: 'Quên break: chuyện gì xảy ra?', fn: 'quenBreak', args: ['1'], argNames: ['n'],
      note: 'Chạy với n = 1, 2, 3, 4 và quan sát đường đi của dòng chạy.',
      code: R`static String quenBreak(int n) {
    String kq = "";
    switch (n) {
        case 1: kq += "A";
        case 2: kq += "B";
        case 3: kq += "C"; break;
        default: kq += "?";
    }
    return kq;
}` },
    { t: 'demo', title: 'Gộp case có chủ ý', fn: 'soNgay', args: ['4'], argNames: ['thang'],
      code: R`static int soNgay(int thang) {
    switch (thang) {
        case 4: case 6: case 9: case 11:
            return 30;
        case 2:
            return 28;
        default:
            return 31;
    }
}` },
    { t: 'h', x: 'switch với String' },
    { t: 'demo', title: 'Chọn lệnh theo chuỗi', fn: 'chonMon', args: ['"pho"'], argNames: ['lenh'],
      code: R`static int chonMon(String lenh) {
    switch (lenh) {
        case "pho": return 45000;
        case "bun": return 40000;
        case "com": return 35000;
        default: return 0;
    }
}` },
    { t: 'h', x: 'Switch expression (Java 14+)' },
    { t: 'p', x: 'Dạng mới dùng mũi tên `->`: **không cần `break`, không bị fall-through**, có thể trả về giá trị trực tiếp và gộp nhiều nhãn bằng dấu phẩy. Nếu không có nhánh nào khớp, cần có `default`.' },
    { t: 'demo', title: 'Phân loại ngày bằng switch expression', fn: 'loaiNgay', args: ['7'], argNames: ['thu'],
      note: 'Thử thu = 3, 8 và 1 (nhánh default ném ngoại lệ).',
      code: R`static String loaiNgay(int thu) {
    return switch (thu) {
        case 2, 3, 4, 5, 6 -> "Ngày làm việc";
        case 7 -> "Thứ bảy";
        case 8 -> "Chủ nhật";
        default -> throw new IllegalArgumentException("Thứ không hợp lệ: " + thu);
    };
}` },
    { t: 'h', x: 'Khi nào dùng if-else, khi nào dùng switch?' },
    { t: 'table', head: ['Dùng if-else khi', 'Dùng switch khi'], rows: [
      ['Điều kiện là **khoảng giá trị** (`diem >= 8`)', 'So khớp **giá trị cụ thể** (1, 2, 3 hoặc "pho", "bun")'],
      ['Điều kiện phức hợp (`&&`, `||`)', 'Nhiều nhánh cùng so với một biến'],
      ['Kiểu `double`, `boolean`, `long`', 'Kiểu `int`, `char`, `String`, `enum`'],
    ] },
  ],
  exercises: [
    { id: 's2-e1', type: 'predict', level: 1, title: 'Quên break (1)',
      q: 'Phương thức trả về giá trị nào?',
      code: R`static String demo() {
    String kq = "";
    int n = 2;
    switch (n) {
        case 1: kq += "A";
        case 2: kq += "B";
        case 3: kq += "C"; break;
        default: kq += "?";
    }
    return kq;
}`,
      run: { fn: 'demo', args: [] }, choices: ['"B"', '"BC"', '"ABC"', '"BC?"'], answer: 1, check: '"BC"',
      explain: 'n = 2 khớp `case 2`, thêm "B". Không có `break` nên trôi xuống `case 3`, thêm "C" rồi mới gặp `break`.' },
    { id: 's2-e2', type: 'predict', level: 2, title: 'Quên break (2)',
      q: 'Gọi `dem(\'c\')` trả về bao nhiêu?',
      code: R`static int dem(char c) {
    int d = 0;
    switch (c) {
        case 'a': d++;
        case 'b': d += 2; break;
        case 'c': d += 3;
        default: d += 4;
    }
    return d;
}`,
      run: { fn: 'dem', args: ["'c'"] }, choices: ['3', '7', '4', '9'], answer: 1, check: '7',
      explain: "'c' khớp `case 'c'`: d = 3. Không có break nên chạy tiếp vào `default`: d = 3 + 4 = 7. Nhánh `default` cũng bị trôi xuống nếu đứng sau mà thiếu break." },
    { id: 's2-e3', type: 'bug', level: 1, title: 'Bắt lỗi thiếu break',
      prompt: 'Mùa đông (tháng 12, 1, 2) đang trả về `"Xuan"` thay vì `"Dong"`. Bấm vào dòng gây ra lỗi.',
      code: R`static String tenMua(int thang) {
    String ten;
    switch (thang) {
        case 12: case 1: case 2:
            ten = "Dong";
        case 3: case 4: case 5:
            ten = "Xuan"; break;
        case 6: case 7: case 8:
            ten = "Ha"; break;
        default:
            ten = "Thu";
    }
    return ten;
}`,
      bugs: { 5: 'Thiếu `break;` sau `ten = "Dong";` nên luồng chạy trôi xuống case của mùa xuân và ghi đè thành "Xuan".' },
      hints: ['Tháng 1 khớp case nào, và sau đó chương trình chạy tiếp đến đâu?'] },
    { id: 's2-e4', type: 'bug', level: 2, title: 'Hai lỗi biên dịch',
      prompt: 'Đoạn code không biên dịch được vì **2 lỗi** liên quan đến cú pháp switch. Tìm cả hai dòng.',
      code: R`static String hang(double diem) {
    switch (diem) {
        case 10: return "Xuat sac";
        case 9: return "Gioi";
        case 9: return "Kha";
        default: return "Khac";
    }
}`,
      bugs: { 2: 'switch không hỗ trợ kiểu `double`. Chỉ dùng int, char, String, enum... (có thể ép sang int hoặc dùng if-else).', 5: 'Nhãn `case 9` bị trùng với dòng 4. Mỗi nhãn chỉ được xuất hiện một lần.' },
      hints: ['Một lỗi nằm ở kiểu dữ liệu của biến trong switch.', 'Lỗi còn lại: hai case có cùng giá trị.'] },
    { id: 's2-e5', type: 'code', level: 2, title: 'Số ngày trong tháng', fn: 'soNgay',
      prompt: 'Trả về số ngày của `thang` trong `nam` (tháng 2: 29 ngày nếu năm nhuận, ngược lại 28). Tháng ngoài 1..12 thì ném `IllegalArgumentException`. **Bắt buộc dùng `switch`.**',
      starter: R`static int soNgay(int thang, int nam) {

}`,
      rules: [{ need: R`\bswitch\b`, msg: 'Bài này yêu cầu dùng câu lệnh switch.' }],
      tests: [{ a: ['1', '2024'], e: '31' }, { a: ['2', '2024'], e: '29' }, { a: ['2', '2023'], e: '28' }, { a: ['4', '2023'], e: '30' }, { a: ['9', '2023'], e: '30' }, { a: ['12', '2023'], e: '31', hide: 1 }, { a: ['2', '1900'], e: '28', hide: 1 }, { a: ['13', '2023'], e: '!IllegalArgumentException' }, { a: ['0', '2023'], e: '!IllegalArgumentException', hide: 1 }],
      hints: ['Gộp các tháng có 30 ngày: `case 4: case 6: case 9: case 11:`.', 'Ném lỗi: `throw new IllegalArgumentException("...");` ở nhánh default (sẽ học kỹ ở phần 5).'],
      solution: R`static int soNgay(int thang, int nam) {
    switch (thang) {
        case 4: case 6: case 9: case 11:
            return 30;
        case 2:
            boolean nhuan = (nam % 4 == 0 && nam % 100 != 0) || nam % 400 == 0;
            return nhuan ? 29 : 28;
        case 1: case 3: case 5: case 7: case 8: case 10: case 12:
            return 31;
        default:
            throw new IllegalArgumentException("Thang khong hop le: " + thang);
    }
}` },
    { id: 's2-e6', type: 'code', level: 2, title: 'Máy tính bỏ túi', fn: 'tinh',
      prompt: 'Thực hiện `a op b` với `op` là `"+"`, `"-"`, `"*"`, `"/"`. Chia cho 0 hoặc phép toán lạ thì ném `IllegalArgumentException`. Dùng `switch` trên chuỗi.',
      starter: R`static double tinh(double a, String op, double b) {

}`,
      rules: [{ need: R`\bswitch\b`, msg: 'Bài này yêu cầu dùng switch trên chuỗi.' }],
      tests: [{ a: ['6', '"+"', '4'], e: '10.0' }, { a: ['6', '"-"', '4'], e: '2.0' }, { a: ['6', '"*"', '4'], e: '24.0' }, { a: ['6', '"/"', '4'], e: '1.5' }, { a: ['6', '"/"', '0'], e: '!IllegalArgumentException' }, { a: ['6', '"%"', '4'], e: '!IllegalArgumentException', hide: 1 }, { a: ['1.5', '"*"', '2'], e: '3.0', hide: 1 }],
      hints: ['`case "+": return a + b;` (return nên không cần break).', 'Với "/", kiểm tra `b == 0` rồi ném lỗi trước khi chia.'],
      solution: R`static double tinh(double a, String op, double b) {
    switch (op) {
        case "+": return a + b;
        case "-": return a - b;
        case "*": return a * b;
        case "/":
            if (b == 0) throw new IllegalArgumentException("Khong chia cho 0");
            return a / b;
        default:
            throw new IllegalArgumentException("Phep toan khong hop le: " + op);
    }
}` },
    { id: 's2-e7', type: 'code', level: 2, title: 'Viết lại bằng switch expression', fn: 'loaiNgay',
      prompt: 'Dùng **switch expression** (mũi tên `->`): thứ 2 đến 6 trả `"LAM VIEC"`, thứ 7 trả `"THU BAY"`, 8 trả `"CHU NHAT"`. Giá trị khác ném `IllegalArgumentException`.',
      starter: R`static String loaiNgay(int thu) {
    return
}`,
      rules: [{ need: '->', msg: 'Bài này yêu cầu dùng switch expression với dấu mũi tên ->.' }],
      tests: [{ a: ['2'], e: '"LAM VIEC"' }, { a: ['6'], e: '"LAM VIEC"' }, { a: ['7'], e: '"THU BAY"' }, { a: ['8'], e: '"CHU NHAT"' }, { a: ['1'], e: '!IllegalArgumentException' }, { a: ['9'], e: '!IllegalArgumentException', hide: 1 }, { a: ['4'], e: '"LAM VIEC"', hide: 1 }],
      hints: ['`return switch (thu) { case 2, 3, 4, 5, 6 -> "LAM VIEC"; ... };` (nhớ dấu `;` sau dấu `}`).', 'Nhánh default: `default -> throw new IllegalArgumentException("...");`'],
      solution: R`static String loaiNgay(int thu) {
    return switch (thu) {
        case 2, 3, 4, 5, 6 -> "LAM VIEC";
        case 7 -> "THU BAY";
        case 8 -> "CHU NHAT";
        default -> throw new IllegalArgumentException("Thu khong hop le: " + thu);
    };
}` },
  ],
},

/* ============================ PHẦN 3 ============================ */
{
  id: 's3', num: 3, title: 'Xử lý chuỗi String', short: 'String', glyph: '"Aa"', minutes: 35, hue: 38,
  blurb: 'String là đối tượng bất biến: so sánh bằng equals, các phương thức hay dùng, định dạng và nối chuỗi.',
  tags: ['equals', 'Phương thức', 'format'],
  lesson: [
    { t: 'h', x: 'String là đối tượng, và bất biến' },
    { t: 'p', x: '`String` không phải kiểu nguyên thủy mà là **đối tượng**. Nội dung của nó **không thể sửa**: mọi phương thức như `toUpperCase()`, `trim()`, `replace()` đều **trả về một chuỗi mới** và để nguyên chuỗi cũ. Muốn dùng kết quả thì phải gán lại.' },
    { t: 'demo', title: 'Gọi phương thức mà không gán lại', fn: 'demo', args: ['"java"'], argNames: ['s'],
      note: 'Dòng đầu tiên gọi toUpperCase() nhưng kết quả bị bỏ đi. Quan sát biến s và t.',
      code: R`static String demo(String s) {
    s.toUpperCase();
    String t = s.toUpperCase();
    return s + " / " + t;
}` },
    { t: 'h', x: '== hay equals()?' },
    { t: 'p', x: '`==` so sánh **địa chỉ** (hai biến có trỏ cùng một đối tượng không). `equals()` so sánh **nội dung** các ký tự. Hai chuỗi giống hệt nhau vẫn có thể là hai đối tượng khác nhau (ví dụ tạo bằng `new String(...)` hoặc nối chuỗi lúc chạy). **Luôn dùng `equals()` để so sánh chuỗi.**' },
    { t: 'demo', title: 'Ba cách so sánh', fn: 'soSanh', args: [], argNames: [],
      code: R`static String soSanh() {
    String a = "Java";
    String b = "Java";
    String c = new String("Java");
    boolean r1 = (a == b);
    boolean r2 = (a == c);
    boolean r3 = a.equals(c);
    return r1 + " " + r2 + " " + r3;
}` },
    { t: 'p', x: '**Chống NullPointerException:** nếu biến có thể là `null`, hãy đặt hằng số lên trước: `"admin".equals(input)`, hoặc dùng `Objects.equals(a, b)`.' },
    { t: 'demo', title: 'So sánh an toàn với null', fn: 'laAdmin', args: ['null'], argNames: ['input'],
      note: 'Sửa thành `input.equals("admin")` rồi chạy lại với null.',
      code: R`static boolean laAdmin(String input) {
    return "admin".equals(input);
}` },
    { t: 'h', x: 'Các phương thức hay dùng' },
    { t: 'table', head: ['Nhóm', 'Phương thức'], rows: [
      ['Truy xuất, tìm kiếm', '`length()`, `charAt(i)`, `indexOf(s)`, `lastIndexOf(s)`, `contains(s)`, `startsWith(s)`, `endsWith(s)`'],
      ['Kiểm tra rỗng', '`isEmpty()` (độ dài 0), `isBlank()` (rỗng hoặc chỉ toàn khoảng trắng, Java 11+)'],
      ['Biến đổi (tạo chuỗi mới)', '`substring(begin, end)` (lấy nửa khoảng [begin, end)), `toUpperCase()`, `toLowerCase()`, `trim()`, `strip()`, `replace(a, b)`'],
      ['Tách và ghép', '`split(regex)` (ra mảng), `String.join(sep, ...)`'],
    ] },
    { t: 'play', title: 'Sân chơi String', vars: { s: '"  Hello Java  "' }, hint: 'Biến s đang là "  Hello Java  ". Sửa biểu thức rồi nhấn Enter. Thử gây lỗi: `s.charAt(50)`.',
      rows: ['s.length()', 's.trim()', 's.trim().toUpperCase()', 's.charAt(2)', 's.indexOf("Java")', 's.substring(2, 7)', 's.contains("java")', 's.isBlank()', 's.replace("a", "@")', 's.trim().split(" ")', 'String.join("-", "a", "b", "c")'] },
    { t: 'h', x: 'Nối chuỗi và định dạng' },
    { t: 'p', x: 'Toán tử `+` tính **từ trái sang phải**: gặp chuỗi là chuyển sang nối chuỗi. Dùng ngoặc để tính số học trước. Với `char`, `\'A\' + 1` là phép cộng số (kết quả 66).' },
    { t: 'play', title: 'Thứ tự nối chuỗi', vars: {}, hint: 'Đoán kết quả trước khi nhìn.',
      rows: ['1 + 2 + "abc"', '"abc" + 1 + 2', '"abc" + (1 + 2)', "'A' + 1", "\"\" + 'A' + 1", "(char) ('A' + 1)"] },
    { t: 'p', x: '`String.format` và `printf` dùng mẫu định dạng: `%s` chuỗi, `%d` số nguyên, `%.2f` số thực làm tròn 2 chữ số, `%n` xuống dòng. Thêm độ rộng: `%5d` (căn phải), `%-8s` (căn trái).' },
    { t: 'play', title: 'Định dạng với format', vars: {}, hint: 'Thử đổi độ rộng và số chữ số thập phân. Thử `String.format("%d", 3.5)` để xem lỗi.',
      rows: ['String.format("%d", 42)', 'String.format("%5d|", 42)', 'String.format("%-5d|", 42)', 'String.format("%.2f", 3.14159)', 'String.format("%8.3f", 3.14159)', 'String.format("%s - %s", "An", 9.5)', 'String.format("%,d", 1234567)', 'String.format("%05d", 42)'] },
    { t: 'tip', x: 'Trong OOP, bạn sẽ dùng `String.format` rất nhiều khi viết phương thức `toString()` của class, và dùng `equals()` khi so sánh các đối tượng.' },
  ],
  exercises: [
    { id: 's3-e1', type: 'predict', level: 1, title: 'String bất biến',
      q: 'Đoạn code in ra gì?',
      code: R`static void demo() {
    String s = "abc";
    s.concat("d");
    s.toUpperCase();
    System.out.println(s);
}`,
      run: { fn: 'demo', args: [] }, choices: ['abc', 'abcd', 'ABCD', 'abcD'], answer: 0, check: 'abc',
      explain: 'String bất biến: `concat` và `toUpperCase` trả về chuỗi mới nhưng kết quả không được gán lại, nên `s` vẫn là "abc".' },
    { id: 's3-e2', type: 'predict', level: 2, title: '== và equals',
      q: 'Phương thức trả về giá trị nào?',
      code: R`static String demo() {
    String a = "hi";
    String b = "h";
    String c = b + "i";
    return (a == c) + " " + a.equals(c);
}`,
      run: { fn: 'demo', args: [] }, choices: ['"true true"', '"true false"', '"false true"', '"false false"'], answer: 2, check: '"false true"',
      explain: '`c` được tạo lúc chạy bằng phép nối nên là một đối tượng mới, khác địa chỉ với `a` (`==` ra false). Nội dung giống nhau nên `equals` ra true. Vì vậy luôn dùng `equals`.' },
    { id: 's3-e3', type: 'predict', level: 2, title: 'Nối chuỗi từ trái sang phải',
      q: 'Phương thức trả về giá trị nào?',
      code: R`static String demo() {
    return 1 + 2 + "3" + 4 + 5;
}`,
      run: { fn: 'demo', args: [] }, choices: ['"12345"', '"3345"', '"15"', 'Lỗi biên dịch'], answer: 1, check: '"3345"',
      explain: '`1 + 2` tính trước thành 3 (cả hai là số). Gặp `"3"` thì chuyển sang nối chuỗi: "33", rồi "334", rồi "3345".' },
    { id: 's3-e4', type: 'bug', level: 2, title: 'Ba lỗi kinh điển với String',
      prompt: 'Phương thức này có **3 lỗi** liên quan đến String (sập chương trình hoặc cho kết quả sai). Tìm cả ba.',
      code: R`static boolean laAdmin(String user, String role) {
    if (user.equals("admin")) {
        return true;
    }
    if (role == "ADMIN") {
        return true;
    }
    String ten = user.trim();
    ten.toUpperCase();
    return ten.equals("ADMIN");
}`,
      bugs: { 2: 'Nếu `user` là null thì `user.equals(...)` ném NullPointerException. Viết `"admin".equals(user)`.', 5: '`==` so sánh địa chỉ, không phải nội dung. Phải dùng `"ADMIN".equals(role)`.', 9: '`toUpperCase()` trả về chuỗi mới, nhưng kết quả bị bỏ đi. Phải gán lại: `ten = ten.toUpperCase();`.' },
      hints: ['Một lỗi liên quan đến null, một lỗi dùng sai toán tử so sánh.', 'Lỗi thứ ba: kết quả của phương thức String không được dùng đến.'] },
    { id: 's3-e5', type: 'fill', level: 1, title: 'Điền phương thức String',
      prompt: 'Điền tên phương thức thích hợp vào các ô trống.',
      code: R`static void demo() {
    String ten = "  An  ";
    String a = ten.{{1}}();                    // bỏ khoảng trắng hai đầu
    int n = "Hello".{{2}}('l');               // vị trí đầu tiên của 'l' (kết quả 2)
    boolean ok = "Java".{{3}}("Ja");          // có bắt đầu bằng "Ja" không
    String t = String.{{4}}("-", "a", "b");   // ghép bằng dấu "-" thành "a-b"
    boolean r = "admin".{{5}}(null);          // so sánh nội dung, an toàn với null
}`,
      answers: { 1: ['trim', 'strip'], 2: ['indexOf'], 3: ['startsWith'], 4: ['join'], 5: ['equals'] },
      hints: ['Ô 1 có hai đáp án đúng. Ô 4 là phương thức static của lớp String.'] },
    { id: 's3-e6', type: 'code', level: 2, title: 'Chuẩn hóa họ tên', fn: 'chuanHoaTen',
      prompt: 'Chuẩn hóa họ tên: bỏ khoảng trắng thừa (đầu, cuối, giữa các từ) và viết hoa chữ cái đầu mỗi từ, phần còn lại viết thường. Chuỗi `null` hoặc chỉ toàn khoảng trắng thì trả về `""`.',
      starter: R`static String chuanHoaTen(String s) {

}`,
      tests: [{ a: ['"  nguyen   van an "'], e: '"Nguyen Van An"' }, { a: ['"TRAN thi b"'], e: '"Tran Thi B"' }, { a: ['"a"'], e: '"A"' }, { a: ['""'], e: '""' }, { a: ['"   "'], e: '""', hide: 1 }, { a: ['null'], e: '""', hide: 1 }],
      hints: ['Dùng `s.trim().split("\\\\s+")` để tách từ (một hoặc nhiều khoảng trắng).', 'Mỗi từ w: `w.substring(0, 1).toUpperCase() + w.substring(1).toLowerCase()`. Chú ý chuỗi rỗng: `substring(0, 1)` sẽ ném lỗi!'],
      solution: R`static String chuanHoaTen(String s) {
    if (s == null || s.isBlank()) return "";
    String[] words = s.trim().split("\\s+");
    StringBuilder sb = new StringBuilder();
    for (String w : words) {
        sb.append(w.substring(0, 1).toUpperCase())
          .append(w.substring(1).toLowerCase())
          .append(" ");
    }
    return sb.toString().trim();
}` },
    { id: 's3-e7', type: 'code', level: 2, title: 'Đếm nguyên âm', fn: 'demNguyenAm',
      prompt: 'Đếm số nguyên âm (a, e, i, o, u, không phân biệt hoa thường) trong chuỗi `s`. Chuỗi `null` trả về 0.',
      starter: R`static int demNguyenAm(String s) {

}`,
      tests: [{ a: ['"Hello World"'], e: '3' }, { a: ['""'], e: '0' }, { a: ['"AEIOU"'], e: '5' }, { a: ['"rhythm"'], e: '0' }, { a: ['null'], e: '0', hide: 1 }, { a: ['"Java Programming"'], e: '5', hide: 1 }],
      hints: ['Duyệt từng ký tự: `for (int i = 0; i < s.length(); i++) { char c = s.charAt(i); ... }`.', 'Chuyển về chữ thường rồi kiểm tra: `"aeiou".indexOf(c) >= 0`.'],
      solution: R`static int demNguyenAm(String s) {
    if (s == null) return 0;
    int dem = 0;
    String nguyenAm = "aeiou";
    for (int i = 0; i < s.length(); i++) {
        char c = Character.toLowerCase(s.charAt(i));
        if (nguyenAm.indexOf(c) >= 0) dem++;
    }
    return dem;
}` },
    { id: 's3-e8', type: 'code', level: 2, title: 'Chuỗi đối xứng', fn: 'laDoiXung',
      prompt: 'Trả về `true` nếu `s` đọc xuôi ngược giống nhau, **bỏ qua khoảng trắng và hoa/thường** (ví dụ "Race car"). Chuỗi rỗng là đối xứng. `null` trả về `false`.',
      starter: R`static boolean laDoiXung(String s) {

}`,
      tests: [{ a: ['"Race car"'], e: 'true' }, { a: ['"Hello"'], e: 'false' }, { a: ['""'], e: 'true' }, { a: ['"A man a plan a canal Panama"'], e: 'true' }, { a: ['"ab"'], e: 'false', hide: 1 }, { a: ['null'], e: 'false', hide: 1 }],
      hints: ['Chuẩn hóa trước: `s.replace(" ", "").toLowerCase()`.', 'Dùng hai chỉ số i (đầu) và j (cuối) tiến vào giữa, gặp ký tự khác nhau thì `return false`.'],
      solution: R`static boolean laDoiXung(String s) {
    if (s == null) return false;
    String t = s.replace(" ", "").toLowerCase();
    int i = 0, j = t.length() - 1;
    while (i < j) {
        if (t.charAt(i) != t.charAt(j)) return false;
        i++;
        j--;
    }
    return true;
}` },
    { id: 's3-e9', type: 'code', level: 2, title: 'Lấy tên đăng nhập từ email', fn: 'layTenDangNhap',
      prompt: 'Trả về phần trước dấu `@` của email. Nếu email `null`, không có `@` hoặc phần trước `@` rỗng thì trả về `""`.',
      starter: R`static String layTenDangNhap(String email) {

}`,
      tests: [{ a: ['"an@gmail.com"'], e: '"an"' }, { a: ['"abc"'], e: '""' }, { a: ['null'], e: '""' }, { a: ['"@x.com"'], e: '""' }, { a: ['"nguyen.van@iuh.edu.vn"'], e: '"nguyen.van"', hide: 1 }],
      hints: ['`email.indexOf(\'@\')` trả về -1 nếu không tìm thấy.', 'Kiểm tra null trước, rồi dùng `substring(0, vitri)`.'],
      solution: R`static String layTenDangNhap(String email) {
    if (email == null) return "";
    int at = email.indexOf('@');
    if (at <= 0) return "";
    return email.substring(0, at);
}` },
  ],
},

/* ============================ PHẦN 4 ============================ */
{
  id: 's4', num: 4, title: 'StringBuilder', short: 'StringBuilder', glyph: '+=', minutes: 15, hue: 340,
  blurb: 'Xây dựng chuỗi hiệu quả: vì sao không nối String trong vòng lặp, và các thao tác chính của StringBuilder.',
  tags: ['append', 'reverse', 'Hiệu năng'],
  lesson: [
    { t: 'h', x: 'Vì sao cần StringBuilder?' },
    { t: 'p', x: 'Vì `String` bất biến, mỗi lần viết `s += x` Java phải **tạo một chuỗi mới** rồi sao chép toàn bộ nội dung cũ sang. Nối 10.000 lần trong vòng lặp nghĩa là tạo hàng chục nghìn chuỗi tạm. `StringBuilder` là một **bộ đệm có thể sửa trực tiếp**, nên chỉ có một đối tượng duy nhất.' },
    { t: 'code', code: R`// Chậm: mỗi vòng lặp tạo một String mới
String s = "";
for (int i = 0; i < 10000; i++) {
    s += i;
}

// Nhanh: chỉ một đối tượng StringBuilder
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 10000; i++) {
    sb.append(i);
}
String ketQua = sb.toString();` },
    { t: 'demo', title: 'Xây chuỗi “1, 2, 3, ...”', fn: 'taoChuoi', args: ['5'], argNames: ['n'],
      note: 'Quan sát giá trị của sb thay đổi sau mỗi vòng lặp (cột biến bên phải).',
      code: R`static String taoChuoi(int n) {
    StringBuilder sb = new StringBuilder();
    for (int i = 1; i <= n; i++) {
        sb.append(i);
        if (i < n) sb.append(", ");
    }
    return sb.toString();
}` },
    { t: 'h', x: 'Các thao tác chính' },
    { t: 'table', head: ['Phương thức', 'Tác dụng'], rows: [
      ['`append(x)`', 'Thêm vào cuối (nhận mọi kiểu), trả về chính nó nên gọi nối tiếp được'],
      ['`insert(i, x)`', 'Chèn x tại vị trí i'],
      ['`reverse()`', 'Đảo ngược chuỗi'],
      ['`deleteCharAt(i)`, `delete(a, b)`', 'Xóa một ký tự, hoặc xóa đoạn [a, b)'],
      ['`replace(a, b, s)`, `setCharAt(i, c)`', 'Thay đoạn, thay một ký tự'],
      ['`length()`, `charAt(i)`, `toString()`', 'Độ dài, đọc ký tự, chuyển về String'],
    ] },
    { t: 'play', title: 'Sân chơi StringBuilder', vars: {}, hint: 'Mỗi dòng là một biểu thức độc lập. Thử nối tiếp nhiều phương thức.',
      rows: ['new StringBuilder("hello").append(" java")', 'new StringBuilder("abc").reverse()', 'new StringBuilder("hello").insert(0, "X")', 'new StringBuilder("hello").deleteCharAt(1)', 'new StringBuilder("hello").replace(1, 3, "ipp")', 'new StringBuilder("a,b,c,").length()', 'new StringBuilder("abc").deleteCharAt(3)'] },
    { t: 'tip', x: 'Khi nào dùng cái nào? Nối vài chuỗi ngắn (một dòng): dùng `+` cho dễ đọc. Nối trong **vòng lặp** hoặc cần sửa chuỗi nhiều lần: dùng `StringBuilder`.' },
    { t: 'p', x: 'Trong OOP, bạn thường dùng `StringBuilder` hoặc `String.format` để dựng nội dung cho phương thức `toString()` của một class, ví dụ in danh sách sinh viên.' },
    { t: 'code', code: R`// Chỉ để tham khảo (class sẽ học ở các buổi sau)
public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("SinhVien[").append(ma).append(", ").append(ten).append("]");
    return sb.toString();
}` },
  ],
  exercises: [
    { id: 's4-e1', type: 'predict', level: 1, title: 'Nối tiếp phương thức',
      q: 'Phương thức trả về giá trị nào?',
      code: R`static String demo() {
    StringBuilder sb = new StringBuilder("ab");
    sb.append("cd").reverse().append("e");
    return sb.toString();
}`,
      run: { fn: 'demo', args: [] }, choices: ['"abcde"', '"dcbae"', '"edcba"', '"dcba"'], answer: 1, check: '"dcbae"',
      explain: '"ab" → append("cd") = "abcd" → reverse() = "dcba" → append("e") = "dcbae". Các phương thức trả về chính đối tượng nên gọi nối tiếp được.' },
    { id: 's4-e2', type: 'predict', level: 2, title: 'Chỉnh sửa tại chỗ',
      q: 'Phương thức trả về giá trị nào?',
      code: R`static String demo() {
    StringBuilder sb = new StringBuilder("hello");
    sb.insert(0, "X");
    sb.deleteCharAt(1);
    sb.setCharAt(0, 'Y');
    return sb.toString();
}`,
      run: { fn: 'demo', args: [] }, choices: ['"Yello"', '"Xello"', '"Yhello"', '"XYello"'], answer: 0, check: '"Yello"',
      explain: '"hello" → insert(0,"X") = "Xhello" → deleteCharAt(1) xóa ký tự "h" = "Xello" → setCharAt(0,\'Y\') = "Yello".' },
    { id: 's4-e3', type: 'bug', level: 2, title: 'Bắt lỗi dùng StringBuilder',
      prompt: 'Phương thức muốn trả về `"1,2,3"` khi n = 3. Có **3 lỗi** (biên dịch hoặc chạy). Tìm cả ba dòng.',
      code: R`static String ghepSo(int n) {
    StringBuilder sb = "";
    for (int i = 1; i <= n; i++) {
        sb.append(i).append(",");
    }
    sb.deleteCharAt(sb.length());
    return sb;
}`,
      bugs: { 2: 'Không thể gán `String` cho `StringBuilder`. Phải viết `new StringBuilder()`.', 6: 'Chỉ số hợp lệ cuối cùng là `length() - 1`. `sb.length()` ném StringIndexOutOfBoundsException.', 7: 'Kiểu trả về là String nên phải `return sb.toString();`.' },
      hints: ['Một lỗi ở khởi tạo, một lỗi ở chỉ số, một lỗi ở kiểu trả về.'] },
    { id: 's4-e4', type: 'code', level: 1, title: 'Ghép dãy số', fn: 'ghepSo',
      prompt: 'Trả về chuỗi `"1,2,3,...,n"` (ngăn cách bằng dấu phẩy, **không** có dấu phẩy ở cuối). `n = 0` trả về `""`. Bắt buộc dùng `StringBuilder`.',
      starter: R`static String ghepSo(int n) {

}`,
      rules: [{ need: R`\bStringBuilder\b`, msg: 'Bài này yêu cầu dùng StringBuilder.' }],
      tests: [{ a: ['5'], e: '"1,2,3,4,5"' }, { a: ['1'], e: '"1"' }, { a: ['0'], e: '""' }, { a: ['3'], e: '"1,2,3"', hide: 1 }, { a: ['10'], e: '"1,2,3,4,5,6,7,8,9,10"', hide: 1 }],
      hints: ['Chỉ thêm dấu phẩy khi `i < n`.', 'Cuối cùng `return sb.toString();`.'],
      solution: R`static String ghepSo(int n) {
    StringBuilder sb = new StringBuilder();
    for (int i = 1; i <= n; i++) {
        sb.append(i);
        if (i < n) sb.append(",");
    }
    return sb.toString();
}` },
    { id: 's4-e5', type: 'code', level: 2, title: 'Đảo thứ tự các từ', fn: 'daoTu',
      prompt: 'Đảo thứ tự các từ trong câu (các từ cách nhau đúng một khoảng trắng): `"Hello Java World"` thành `"World Java Hello"`. Dùng `split` và `StringBuilder`.',
      starter: R`static String daoTu(String s) {

}`,
      rules: [{ need: R`\bStringBuilder\b`, msg: 'Bài này yêu cầu dùng StringBuilder.' }],
      tests: [{ a: ['"a b c"'], e: '"c b a"' }, { a: ['"Hello"'], e: '"Hello"' }, { a: ['"one two"'], e: '"two one"' }, { a: ['"Hello Java World"'], e: '"World Java Hello"' }, { a: ['""'], e: '""', hide: 1 }],
      hints: ['`String[] w = s.trim().split(" ");` rồi duyệt ngược từ cuối về đầu.', 'Chỉ thêm khoảng trắng giữa các từ, không thêm ở cuối.'],
      solution: R`static String daoTu(String s) {
    String[] w = s.trim().split(" ");
    StringBuilder sb = new StringBuilder();
    for (int i = w.length - 1; i >= 0; i--) {
        sb.append(w[i]);
        if (i > 0) sb.append(" ");
    }
    return sb.toString();
}` },
    { id: 's4-e6', type: 'code', level: 3, title: 'Thử thách: nén chuỗi', fn: 'nenChuoi',
      prompt: 'Nén chuỗi bằng cách đếm các ký tự liên tiếp giống nhau: `"aaabcc"` thành `"a3b1c2"`. Chuỗi rỗng trả về `""`.',
      starter: R`static String nenChuoi(String s) {

}`,
      tests: [{ a: ['"aaabcc"'], e: '"a3b1c2"' }, { a: ['"a"'], e: '"a1"' }, { a: ['""'], e: '""' }, { a: ['"abc"'], e: '"a1b1c1"', hide: 1 }, { a: ['"zzzz"'], e: '"z4"', hide: 1 }, { a: ['"aabbaa"'], e: '"a2b2a2"', hide: 1 }],
      hints: ['Dùng chỉ số i; với mỗi ký tự c, chạy một vòng while đếm số lần liên tiếp bằng c.', 'Sau khi đếm xong: `sb.append(c).append(dem);`'],
      solution: R`static String nenChuoi(String s) {
    StringBuilder sb = new StringBuilder();
    int i = 0;
    while (i < s.length()) {
        char c = s.charAt(i);
        int dem = 0;
        while (i < s.length() && s.charAt(i) == c) {
            dem++;
            i++;
        }
        sb.append(c).append(dem);
    }
    return sb.toString();
}` },
  ],
},

/* ============================ PHẦN 5 ============================ */
{
  id: 's5', num: 5, title: 'Ném ngoại lệ', short: 'Exception', glyph: 'throw', minutes: 15, hue: 300,
  blurb: 'Bảo vệ dữ liệu trong OOP: nguyên lý fail-fast, throw new, và bắt lỗi bằng try – catch.',
  tags: ['throw', 'try–catch', 'Fail-fast'],
  lesson: [
    { t: 'h', x: 'Vì sao phải ném ngoại lệ? (Fail-fast)' },
    { t: 'p', x: 'Khi dữ liệu không hợp lệ (điểm = 15, tuổi âm, mẫu số = 0...), cách tệ nhất là **âm thầm bỏ qua**, vì lỗi sẽ lan đi và rất khó truy vết. Nguyên lý **fail-fast**: phát hiện sai là **dừng ngay và báo lỗi rõ ràng** tại chính chỗ sai. Trong OOP, đó thường là constructor và các setter.' },
    { t: 'p', x: 'Cú pháp: `throw new TênNgoạiLệ("thông báo");`. Khi `throw` chạy, phương thức dừng ngay lập tức và lỗi được chuyển lên nơi gọi.' },
    { t: 'demo', title: 'Chia hai số nguyên', fn: 'chiaSo', args: ['6', '0'], argNames: ['a', 'b'],
      note: 'Chạy với b = 0 để xem ngoại lệ được ném ra, rồi đổi b = 4.',
      code: R`static double chiaSo(int a, int b) {
    if (b == 0) {
        throw new IllegalArgumentException("Mẫu số phải khác 0");
    }
    return (double) a / b;
}` },
    { t: 'h', x: 'Bắt ngoại lệ bằng try – catch' },
    { t: 'p', x: 'Nơi **gọi** phương thức có thể bắt lỗi để xử lý tiếp thay vì để chương trình sập. Khối `finally` (nếu có) luôn chạy dù có lỗi hay không.' },
    { t: 'demo', title: 'Đổi chuỗi sang số an toàn', fn: 'thuChuyen', args: ['"12a"'], argNames: ['s'],
      note: 'Thử s = "42" và s = "12a". Dòng nào bị bỏ qua khi có lỗi?',
      code: R`static String thuChuyen(String s) {
    try {
        int n = Integer.parseInt(s);
        return "So: " + n;
    } catch (NumberFormatException e) {
        return "Không phải số: " + e.getMessage();
    }
}` },
    { t: 'h', x: 'Ứng dụng trong OOP' },
    { t: 'p', x: 'Đây là mẫu bạn sẽ gặp lặp đi lặp lại: class tự bảo vệ dữ liệu của mình bằng cách kiểm tra trong setter (và constructor gọi lại setter).' },
    { t: 'code', code: R`// Chỉ để tham khảo (class sẽ học ở các buổi sau)
public class SinhVien {
    private String ten;
    private double diem;

    public SinhVien(String ten, double diem) {
        setTen(ten);
        setDiem(diem);     // dùng lại logic kiểm tra
    }
    public void setTen(String ten) {
        if (ten == null || ten.isBlank())
            throw new IllegalArgumentException("Tên không được rỗng");
        this.ten = ten.trim();
    }
    public void setDiem(double diem) {
        if (diem < 0 || diem > 10)
            throw new IllegalArgumentException("Điểm phải từ 0 đến 10");
        this.diem = diem;
    }
}` },
    { t: 'table', head: ['Ngoại lệ', 'Khi nào xảy ra / khi nào nên ném'], rows: [
      ['`IllegalArgumentException`', 'Tham số truyền vào sai giá trị (điểm âm, tên rỗng)'],
      ['`IllegalStateException`', 'Đối tượng ở trạng thái không cho phép thao tác (rút tiền khi số dư không đủ)'],
      ['`NullPointerException`', 'Gọi phương thức trên `null`'],
      ['`ArithmeticException`', 'Chia số nguyên cho 0'],
      ['`NumberFormatException`', 'Đổi chuỗi sang số thất bại'],
      ['`StringIndexOutOfBoundsException`', 'Chỉ số ký tự ngoài phạm vi chuỗi'],
    ] },
    { t: 'play', title: 'Gây lỗi có chủ đích', vars: {}, hint: 'Mỗi biểu thức đang gây một ngoại lệ khác nhau. Thử đổi giá trị để chúng chạy thành công.',
      rows: ['Integer.parseInt("12a")', 'Integer.parseInt("")', '"abc".charAt(5)', '10 / 0', '10.0 / 0', 'Integer.parseInt("42")', '"abc".substring(2, 1)'] },
    { t: 'tip', x: 'Không cần đi sâu vào checked/unchecked ở giai đoạn này. Cứ nhớ: để báo dữ liệu sai, hãy ném `IllegalArgumentException` (hoặc `IllegalStateException`) kèm thông báo rõ ràng.' },
  ],
  exercises: [
    { id: 's5-e1', type: 'predict', level: 2, title: 'Dòng chạy try–catch–finally',
      q: 'Phương thức trả về giá trị nào?',
      code: R`static String demo() {
    int x = -1;
    try {
        if (x < 0) throw new IllegalArgumentException("am");
        return "ok";
    } catch (IllegalArgumentException e) {
        return "loi: " + e.getMessage();
    } finally {
        x = 0;
    }
}`,
      run: { fn: 'demo', args: [] }, choices: ['"ok"', '"loi: am"', '"loi: null"', 'Chương trình dừng với lỗi chưa bắt'], answer: 1, check: '"loi: am"',
      explain: 'x < 0 nên `throw` chạy, bỏ qua `return "ok"`. Ngoại lệ được `catch` bắt, `e.getMessage()` là "am". `finally` vẫn chạy nhưng không đổi kết quả đã trả về.' },
    { id: 's5-e2', type: 'mcq', level: 1, title: 'Setter nên làm gì?',
      q: 'Phương thức `setDiem(double d)` nhận `d = 15` (thang điểm 10). Theo nguyên lý fail-fast, cách xử lý nào tốt nhất?',
      choices: ['Âm thầm gán điểm = 10 (cắt về tối đa) mà không báo gì', 'Bỏ qua lời gọi, giữ điểm cũ, không báo gì', 'Ném `IllegalArgumentException` kèm thông báo rõ ràng', 'In "Lỗi" ra màn hình rồi vẫn gán 15'], answer: 2,
      explain: 'Ném ngoại lệ buộc nơi gọi biết dữ liệu sai ngay lập tức, thay vì để dữ liệu hỏng lan đi khắp chương trình. Các cách còn lại che giấu lỗi hoặc vẫn để dữ liệu sai lọt vào đối tượng.' },
    { id: 's5-e3', type: 'bug', level: 1, title: 'Bắt lỗi khi ném ngoại lệ',
      prompt: 'Hai phương thức dưới đây đều **không ném ngoại lệ đúng cách**. Tìm **2 dòng** sai.',
      code: R`static int datTuoi(int tuoi) {
    if (tuoi < 0 || tuoi > 150) {
        new IllegalArgumentException("Tuoi khong hop le");
    }
    return tuoi;
}
static int chia(int a, int b) {
    if (b == 0) {
        throw "Mau so bang 0";
    }
    return a / b;
}`,
      bugs: { 3: 'Tạo đối tượng ngoại lệ nhưng **thiếu `throw`**, nên không có gì được ném ra và tuổi sai vẫn được chấp nhận.', 9: 'Sau `throw` phải là một đối tượng ngoại lệ: `throw new IllegalArgumentException("...");`, không được là String.' },
      hints: ['Một lỗi là thiếu một từ khóa, lỗi kia là ném sai kiểu.'] },
    { id: 's5-e4', type: 'code', level: 1, title: 'Setter kiểm tra điểm', fn: 'datDiem',
      prompt: 'Trả về `diem` nếu nằm trong 0..10 (kể cả hai đầu). Ngược lại ném `IllegalArgumentException` với thông báo rõ ràng.',
      starter: R`static double datDiem(double diem) {

}`,
      tests: [{ a: ['7.5'], e: '7.5' }, { a: ['0'], e: '0.0' }, { a: ['10'], e: '10.0' }, { a: ['-1'], e: '!IllegalArgumentException' }, { a: ['10.5'], e: '!IllegalArgumentException' }, { a: ['-0.01'], e: '!IllegalArgumentException', hide: 1 }],
      hints: ['Guard clause: `if (diem < 0 || diem > 10) { throw ...; }`'],
      solution: R`static double datDiem(double diem) {
    if (diem < 0 || diem > 10) {
        throw new IllegalArgumentException("Diem phai tu 0 den 10");
    }
    return diem;
}` },
    { id: 's5-e5', type: 'code', level: 2, title: 'Đổi chuỗi sang số an toàn', fn: 'chuyenSo',
      prompt: 'Đổi `s` sang số nguyên bằng `Integer.parseInt`. Nếu đổi thất bại (chuỗi không phải số, rỗng, hoặc `null`) thì trả về `-1`. **Bắt buộc dùng try–catch.**',
      starter: R`static int chuyenSo(String s) {

}`,
      rules: [{ need: R`\btry\b`, msg: 'Bài này yêu cầu dùng try–catch.' }],
      tests: [{ a: ['"42"'], e: '42' }, { a: ['"abc"'], e: '-1' }, { a: ['""'], e: '-1' }, { a: ['"-7"'], e: '-7' }, { a: ['null'], e: '-1', hide: 1 }, { a: ['"12.5"'], e: '-1', hide: 1 }],
      hints: ['`catch (NumberFormatException e) { return -1; }`', 'Lưu ý: `Integer.parseInt(null)` ném NumberFormatException, nhưng `s.trim()` với s = null thì ném NullPointerException!'],
      solution: R`static int chuyenSo(String s) {
    try {
        return Integer.parseInt(s);
    } catch (NumberFormatException e) {
        return -1;
    }
}` },
    { id: 's5-e6', type: 'code', level: 2, title: 'Rút tiền (IllegalState)', fn: 'rutTien',
      prompt: 'Trả về số dư mới sau khi rút `soTien` từ `soDu`. Nếu `soTien <= 0` ném `IllegalArgumentException`. Nếu `soTien > soDu` ném `IllegalStateException`.',
      starter: R`static double rutTien(double soDu, double soTien) {

}`,
      tests: [{ a: ['100', '30'], e: '70.0' }, { a: ['100', '100'], e: '0.0' }, { a: ['100', '0'], e: '!IllegalArgumentException' }, { a: ['100', '-5'], e: '!IllegalArgumentException' }, { a: ['100', '150'], e: '!IllegalStateException' }, { a: ['50.5', '0.5'], e: '50.0', hide: 1 }],
      hints: ['Hai điều kiện, hai loại ngoại lệ khác nhau: sai tham số hay sai trạng thái?'],
      solution: R`static double rutTien(double soDu, double soTien) {
    if (soTien <= 0) {
        throw new IllegalArgumentException("So tien phai lon hon 0");
    }
    if (soTien > soDu) {
        throw new IllegalStateException("So du khong du");
    }
    return soDu - soTien;
}` },
    { id: 's5-e7', type: 'code', level: 3, title: 'Tổng hợp: tạo sinh viên hợp lệ', fn: 'taoSinhVien',
      prompt: 'Mô phỏng constructor của class SinhVien. Ném `IllegalArgumentException` nếu: mã `null` hoặc rỗng/chỉ khoảng trắng; tên `null` hoặc rỗng/chỉ khoảng trắng; điểm ngoài 0..10. Nếu hợp lệ trả về chuỗi dạng `"SV01 - An - 8.5"` (mã và tên đã `trim()`, điểm 1 chữ số thập phân, dùng `String.format`).',
      starter: R`static String taoSinhVien(String ma, String ten, double diem) {

}`,
      tests: [{ a: ['"SV01"', '" An "', '8.5'], e: '"SV01 - An - 8.5"' }, { a: ['" "', '"An"', '8'], e: '!IllegalArgumentException' }, { a: ['"SV02"', 'null', '8'], e: '!IllegalArgumentException' }, { a: ['"SV03"', '"Binh"', '11'], e: '!IllegalArgumentException' }, { a: ['"SV04"', '"Chi"', '0'], e: '"SV04 - Chi - 0.0"' }, { a: ['null', '"X"', '5'], e: '!IllegalArgumentException', hide: 1 }, { a: ['" SV05 "', '"Dung"', '10'], e: '"SV05 - Dung - 10.0"', hide: 1 }],
      hints: ['Kiểm tra null trước isBlank() (đoản mạch ||).', '`String.format("%s - %s - %.1f", ma.trim(), ten.trim(), diem)`'],
      solution: R`static String taoSinhVien(String ma, String ten, double diem) {
    if (ma == null || ma.isBlank()) throw new IllegalArgumentException("Ma sinh vien khong duoc rong");
    if (ten == null || ten.isBlank()) throw new IllegalArgumentException("Ten khong duoc rong");
    if (diem < 0 || diem > 10) throw new IllegalArgumentException("Diem phai tu 0 den 10");
    return String.format("%s - %s - %.1f", ma.trim(), ten.trim(), diem);
}` },
  ],
},
];

if (typeof module !== 'undefined') module.exports = { SECTIONS };
