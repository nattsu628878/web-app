// generateボタンのsubmitイベントリスナーを削除
// document.getElementById("imageForm").addEventListener("submit", function (e) {
//     e.preventDefault();
//   ...
// });

// 画像生成＆ダウンロードリンク更新関数
function updateImageAndDownloadLink() {
  const color = document.getElementById("color").value;
  const width = parseInt(document.getElementById("width").value);
  const height = parseInt(document.getElementById("height").value);
  const canvas = document.getElementById("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  const link = document.getElementById("downloadLink");
  link.href = canvas.toDataURL("image/png");
}

// プレビュー更新関数
function updatePreview() {
  const color = document.getElementById("color").value;
  const width = parseInt(document.getElementById("width").value);
  const height = parseInt(document.getElementById("height").value);
  const previewCanvas = document.getElementById("previewCanvas");
  if (!previewCanvas) return;
  // サムネイルサイズ（例: 最大幅100px, 高さは比率維持）
  const maxThumbWidth = 100;
  const scale = width > 0 ? maxThumbWidth / width : 1;
  const thumbWidth = Math.max(1, Math.round(width * scale));
  const thumbHeight = Math.max(1, Math.round(height * scale));
  previewCanvas.width = thumbWidth;
  previewCanvas.height = thumbHeight;
  const ctx = previewCanvas.getContext("2d");
  ctx.clearRect(0, 0, thumbWidth, thumbHeight);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, thumbWidth, thumbHeight);
}

// 入力値が変わるたびに画像とダウンロードリンクを更新
["color", "width", "height"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    updatePreview();
    updateImageAndDownloadLink();
  });
});

// 初期表示時にも更新
updatePreview();
updateImageAndDownloadLink();
  