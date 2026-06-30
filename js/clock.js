// ===== 时钟 =====
const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  timeEl.textContent = `${h}:${m}`;

  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const y = now.getFullYear();
  const mo = now.getMonth() + 1;
  const d = now.getDate();
  const w = weekdays[now.getDay()];
  dateEl.textContent = `${y}年${mo}月${d}日 ${w}`;
}

updateClock();
setInterval(updateClock, 1000);
