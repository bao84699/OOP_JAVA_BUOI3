/**
 * Nhận kết quả bài tập từ trang bài giảng Java OOP và ghi vào Google Sheet.
 *
 * CÁCH CÀI (làm 1 lần, khoảng 3 phút):
 * 1. Tạo một Google Sheet mới. Vào menu Tiện ích mở rộng > Apps Script.
 * 2. Xóa code mẫu, dán toàn bộ file này vào, bấm Lưu.
 * 3. Chọn hàm "setup" ở thanh trên rồi bấm Chạy (cấp quyền khi được hỏi). Hàm này tạo sẵn các tab KetQua, TongHop, BaiKho.
 * 4. Bấm Triển khai > Tùy chọn triển khai mới > loại "Ứng dụng web":
 *      - Thực thi dưới tên: Tôi
 *      - Người có quyền truy cập: Bất kỳ ai
 *    Bấm Triển khai và sao chép "URL ứng dụng web".
 * 5. Dán URL đó vào SHEET_URL trong file HTML (khối CONFIG ở gần đầu file).
 *
 * Khi sửa code script sau này: Triển khai > Quản lý bản triển khai > Chỉnh sửa > Phiên bản mới.
 */
const SECRET = '';          // Nếu đặt, phải trùng với CONFIG.SECRET trong file HTML. Để trống = không kiểm tra.
const TONG_SO_BAI = 37;     // Tổng số bài tập (dùng để tính % hoàn thành)
const SO_PHAN = 5;

const HEAD = ['Thời gian', 'Họ tên', 'MSSV', 'Phần', 'Mã bài', 'Loại', 'Tên bài', 'Đúng', 'Điểm (0-1)', 'Lần thử', 'Gợi ý đã dùng', 'Thời gian (giây)', 'Đã xem đáp án', 'Bài làm'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const d = JSON.parse(e.postData.contents);
    if (SECRET && d.secret !== SECRET) return out_('forbidden');
    const sh = sheet_('KetQua');
    sh.appendRow([new Date(d.ts || Date.now()), String(d.name || ''), String(d.mssv || ''), d.section || '', d.exId || '', d.type || '', d.title || '',
      d.correct === true, Number(d.score) || 0, Number(d.attempt) || 0, Number(d.hints) || 0, Number(d.seconds) || 0, d.solutionViewed === true, String(d.answer || '').slice(0, 1800)]);
    return out_('ok');
  } catch (err) {
    return out_('error: ' + err);
  } finally {
    try { lock.releaseLock(); } catch (x) { /* bỏ qua */ }
  }
}
function doGet() { return out_('Java OOP – máy chủ nhận kết quả đang hoạt động.'); }
function out_(t) { return ContentService.createTextOutput(t); }
function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function setup() {
  // --- KetQua: mỗi lần nộp bài là một dòng ---
  const kq = sheet_('KetQua');
  if (kq.getLastRow() === 0) kq.appendRow(HEAD);
  kq.getRange(1, 1, 1, HEAD.length).setFontWeight('bold').setBackground('#ece9ff');
  kq.setFrozenRows(1);
  kq.getRange('C:C').setNumberFormat('@');            // giữ nguyên số 0 đầu của MSSV
  kq.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  kq.setColumnWidth(14, 420);

  // --- TongHop: mỗi học sinh một dòng ---
  const th = sheet_('TongHop'); th.clear();
  const hh = ['MSSV', 'Họ tên', 'Số bài đạt', 'Tổng số bài', '% hoàn thành'];
  for (let i = 1; i <= SO_PHAN; i++) hh.push('Phần ' + i + ' (bài đạt)');
  hh.push('Số lần nộp', 'Số bài xem đáp án', 'Lần nộp gần nhất');
  th.getRange(1, 1, 1, hh.length).setValues([hh]).setFontWeight('bold').setBackground('#ece9ff');
  th.setFrozenRows(1);
  th.getRange('A2').setFormula('=IFERROR(SORT(UNIQUE(FILTER(KetQua!C2:C, KetQua!C2:C<>""))),"")');
  const N = 300, rows = [];
  for (let r = 2; r < 2 + N; r++) {
    const a = '$A' + r, row = [];
    row.push(r === 2 ? null : null);
    row.push('=IF(' + a + '="","",IFERROR(INDEX(KetQua!$B$2:$B,MATCH(' + a + ',KetQua!$C$2:$C,0)),""))');
    row.push('=IF(' + a + '="","",IFERROR(COUNTUNIQUE(FILTER(KetQua!$E$2:$E,KetQua!$C$2:$C=' + a + ',KetQua!$H$2:$H=TRUE)),0))');
    row.push('=IF(' + a + '="","",' + TONG_SO_BAI + ')');
    row.push('=IF(' + a + '="","",C' + r + '/D' + r + ')');
    for (let i = 1; i <= SO_PHAN; i++) row.push('=IF(' + a + '="","",IFERROR(COUNTUNIQUE(FILTER(KetQua!$E$2:$E,KetQua!$C$2:$C=' + a + ',KetQua!$H$2:$H=TRUE,KetQua!$D$2:$D="s' + i + '")),0))');
    row.push('=IF(' + a + '="","",COUNTIF(KetQua!$C$2:$C,' + a + '))');
    row.push('=IF(' + a + '="","",IFERROR(COUNTUNIQUE(FILTER(KetQua!$E$2:$E,KetQua!$C$2:$C=' + a + ',KetQua!$M$2:$M=TRUE)),0))');
    row.push('=IF(' + a + '="","",IFERROR(MAXIFS(KetQua!$A$2:$A,KetQua!$C$2:$C,' + a + '),""))');
    rows.push(row);
  }
  th.getRange(2, 2, N, hh.length - 1).setFormulas(rows.map(r => r.slice(1)));
  th.getRange(2, 5, N, 1).setNumberFormat('0%');
  th.getRange(2, hh.length, N, 1).setNumberFormat('dd/MM HH:mm');
  const rule = SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($E2<>"",$E2<0.5)').setBackground('#fde2e4').setRanges([th.getRange(2, 1, N, hh.length)]).build();
  th.setConditionalFormatRules([rule]);   // tô đỏ học sinh dưới 50%
  th.autoResizeColumns(1, hh.length);

  // --- BaiKho: bài nào cả lớp hay sai ---
  const bk = sheet_('BaiKho'); bk.clear();
  const bh = ['Mã bài', 'Tên bài', 'Số học sinh đã thử', 'Số học sinh đạt', 'Tỉ lệ đạt', 'Tổng lượt nộp', 'Trung bình lượt/HS'];
  bk.getRange(1, 1, 1, bh.length).setValues([bh]).setFontWeight('bold').setBackground('#ece9ff');
  bk.setFrozenRows(1);
  bk.getRange('A2').setFormula('=IFERROR(UNIQUE(FILTER(KetQua!E2:E, KetQua!E2:E<>"")),"")');
  const brows = [];
  for (let r = 2; r < 80; r++) {
    const a = '$A' + r;
    brows.push([
      '=IF(' + a + '="","",IFERROR(INDEX(KetQua!$G$2:$G,MATCH(' + a + ',KetQua!$E$2:$E,0)),""))',
      '=IF(' + a + '="","",IFERROR(COUNTUNIQUE(FILTER(KetQua!$C$2:$C,KetQua!$E$2:$E=' + a + ')),0))',
      '=IF(' + a + '="","",IFERROR(COUNTUNIQUE(FILTER(KetQua!$C$2:$C,KetQua!$E$2:$E=' + a + ',KetQua!$H$2:$H=TRUE)),0))',
      '=IF(' + a + '="","",IF(C' + r + '=0,0,D' + r + '/C' + r + '))',
      '=IF(' + a + '="","",COUNTIF(KetQua!$E$2:$E,' + a + '))',
      '=IF(' + a + '="","",IF(C' + r + '=0,0,ROUND(F' + r + '/C' + r + ',1)))',
    ]);
  }
  bk.getRange(2, 2, brows.length, 6).setFormulas(brows);
  bk.getRange(2, 5, brows.length, 1).setNumberFormat('0%');
  bk.autoResizeColumns(1, bh.length);
  SpreadsheetApp.getActiveSpreadsheet().toast('Đã tạo xong 3 tab: KetQua, TongHop, BaiKho.');
}
