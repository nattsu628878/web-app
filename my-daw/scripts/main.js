// main.js

document.addEventListener('DOMContentLoaded', () => {
  // Canvas初期化
  const canvas = document.getElementById('timeline-canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText('タイムライン', 20, 40);

  // 再生・停止ボタン
  const playBtn = document.getElementById('play-btn');
  const stopBtn = document.getElementById('stop-btn');

  playBtn.addEventListener('click', () => {
    alert('再生（ダミー）');
  });

  stopBtn.addEventListener('click', () => {
    alert('停止（ダミー）');
  });
}); 