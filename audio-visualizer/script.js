// オーディオ処理に必要なグローバル変数の宣言
let audioContext;      // Web Audio APIのメインコンテキスト
let analyser;         // 音声分析用のアナライザーノード
let canvas;           // スペクトラム表示用のキャンバス要素
let ctx;              // キャンバスの描画コンテキスト
let mediaRecorder;    // 録画用のMediaRecorder
let chunks = [];      // 録画データの一時保存用配列

// グローバル変数に設定オブジェクトを追加
let settings = {
    currentMode: 'spectrum',
    spectrum: {
        minFreq: 20,
        maxFreq: 14400,
        backgroundColor: '#000000',
        barColor: '#ffffff',
        fftSize: 2048,
        barCount: 64,
        spectrumStyle: 'normal',
        barWidthPercent: 90,
        amplitudeScale: 100
    },
    waveform: {
        color: '#ffffff',
        backgroundColor: '#000000',
        style: 'line',
        amplitude: 100
    }
};

// DOMの読み込み完了時の初期設定
document.addEventListener('DOMContentLoaded', () => {
    // キャンバス要素の取得と設定
    canvas = document.getElementById('spectrumCanvas');
    ctx = canvas.getContext('2d');
    
    // 音声処理開始ボタンのイベントリスナー設定
    document.getElementById('processButton').addEventListener('click', processAudio);

    // 周波数スライダーの設定
    const minFreqRange = document.getElementById('minFreqRange');
    const maxFreqRange = document.getElementById('maxFreqRange');
    const freqRangeText = document.getElementById('freqRangeText');

    // スライダーの値が変更されたときの処理
    function updateFrequencyRange() {
        const minVal = parseInt(minFreqRange.value);
        const maxVal = parseInt(maxFreqRange.value);

        // 最小値が最大値を超えないようにする
        if (minVal >= maxVal) {
            if (this === minFreqRange) {
                minFreqRange.value = maxVal - 10;
            } else {
                maxFreqRange.value = minVal + 10;
            }
        }

        settings.spectrum.minFreq = parseInt(minFreqRange.value);
        settings.spectrum.maxFreq = parseInt(maxFreqRange.value);
        freqRangeText.textContent = `${settings.spectrum.minFreq}Hz - ${settings.spectrum.maxFreq}Hz`;
    }

    minFreqRange.addEventListener('input', updateFrequencyRange);
    maxFreqRange.addEventListener('input', updateFrequencyRange);

    // バーの幅スライダーの設定
    const barWidthSlider = document.getElementById('barWidth');
    const barWidthText = document.getElementById('barWidthText');
    
    barWidthSlider.addEventListener('input', () => {
        settings.spectrum.barWidthPercent = parseInt(barWidthSlider.value);
        barWidthText.textContent = `${settings.spectrum.barWidthPercent}%`;
    });

    // 倍率スライダーの設定
    const amplitudeScale = document.getElementById('amplitudeScale');
    const amplitudeScaleText = document.getElementById('amplitudeScaleText');
    
    amplitudeScale.addEventListener('input', () => {
        settings.spectrum.amplitudeScale = parseInt(amplitudeScale.value);
        amplitudeScaleText.textContent = `${settings.spectrum.amplitudeScale}%`;
    });

    // 設定パネルの要素を取得
    const modeSelector = document.querySelector('.mode-selector');
    const spectrumSettings = document.getElementById('spectrumSettings');
    const waveformSettings = document.getElementById('waveformSettings');

    // 初期状態で設定パネルを非表示に
    modeSelector.style.display = 'none';
    spectrumSettings.style.display = 'none';
    waveformSettings.style.display = 'none';

    // ファイル選択時の処理を更新
    document.getElementById('audioInput').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            // モード選択を表示
            modeSelector.style.display = 'flex';
            // デフォルトモード（spectrum）の設定パネルを表示
            spectrumSettings.style.display = 'block';
        } else {
            // ファイルが選択されていない場合は全て非表示
            modeSelector.style.display = 'none';
            spectrumSettings.style.display = 'none';
            waveformSettings.style.display = 'none';
        }
    });

    // モード切り替えの処理
    const modeButtons = document.querySelectorAll('.mode-button');
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.dataset.mode;
            settings.currentMode = mode;

            // ボタンのアクティブ状態を更新
            modeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 設定パネルの表示を切り替え
            spectrumSettings.style.display = mode === 'spectrum' ? 'block' : 'none';
            waveformSettings.style.display = mode === 'waveform' ? 'block' : 'none';
        });
    });

    // 波形設定の初期化
    initWaveformSettings();
    // スペクトラム設定の初期化を追加
    initSpectrumSettings();
});

// 波形設定の初期化関数
function initWaveformSettings() {
    const waveColor = document.getElementById('waveColor');
    const waveBackground = document.getElementById('waveBackground');
    const waveStyle = document.getElementById('waveStyle');
    const waveAmplitude = document.getElementById('waveAmplitude');
    const waveAmplitudeText = document.getElementById('waveAmplitudeText');

    waveColor.addEventListener('input', (e) => {
        settings.waveform.color = e.target.value;
    });

    waveBackground.addEventListener('input', (e) => {
        settings.waveform.backgroundColor = e.target.value;
    });

    waveStyle.addEventListener('input', (e) => {
        settings.waveform.style = e.target.value;
    });

    waveAmplitude.addEventListener('input', (e) => {
        settings.waveform.amplitude = parseInt(e.target.value);
        waveAmplitudeText.textContent = `${settings.waveform.amplitude}%`;
    });
}

// スペクトラム設定の初期化関数を追加
function initSpectrumSettings() {
    const backgroundColor = document.getElementById('backgroundColor');
    const barColor = document.getElementById('barColor');
    const fftSize = document.getElementById('fftSize');
    const barCount = document.getElementById('barCount');
    const spectrumStyle = document.getElementById('spectrumStyle');
    const barWidth = document.getElementById('barWidth');
    const barWidthText = document.getElementById('barWidthText');
    const amplitudeScale = document.getElementById('amplitudeScale');
    const amplitudeScaleText = document.getElementById('amplitudeScaleText');

    backgroundColor.addEventListener('input', (e) => {
        settings.spectrum.backgroundColor = e.target.value;
    });

    barColor.addEventListener('input', (e) => {
        settings.spectrum.barColor = e.target.value;
    });

    fftSize.addEventListener('change', (e) => {
        settings.spectrum.fftSize = parseInt(e.target.value);
    });

    barCount.addEventListener('input', (e) => {
        settings.spectrum.barCount = parseInt(e.target.value);
    });

    spectrumStyle.addEventListener('change', (e) => {
        settings.spectrum.spectrumStyle = e.target.value;
    });

    barWidth.addEventListener('input', (e) => {
        settings.spectrum.barWidthPercent = parseInt(e.target.value);
        barWidthText.textContent = `${settings.spectrum.barWidthPercent}%`;
    });

    amplitudeScale.addEventListener('input', (e) => {
        settings.spectrum.amplitudeScale = parseInt(e.target.value);
        amplitudeScaleText.textContent = `${settings.spectrum.amplitudeScale}%`;
    });
}

async function processAudio() {
    // ファイル入力の確認
    const audioFile = document.getElementById('audioInput').files[0];
    if (!audioFile) {
        alert('Select a WAV file.');
        return;
    }

    // オーディオコンテキストとアナライザーの初期化
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    
    // モードに応じてアナライザーの設定を変更
    if (settings.currentMode === 'spectrum') {
        analyser.fftSize = settings.spectrum.fftSize;
    } else {
        // 波形モードではより細かい波形を表示するために大きなFFTサイズを使用
        analyser.fftSize = 2048;  // 波形表示用の固定値
    }

    // 周波数範囲の計算（スペクトラムモードの場合のみ必要）
    let minIndex = 0, maxIndex = 0;
    if (settings.currentMode === 'spectrum') {
        const nyquist = audioContext.sampleRate / 2;
        minIndex = Math.floor(settings.spectrum.minFreq * analyser.frequencyBinCount / nyquist);
        maxIndex = Math.floor(settings.spectrum.maxFreq * analyser.frequencyBinCount / nyquist);
    }

    // オーディオファイルの読み込みと処理
    const audioBuffer = await audioFile.arrayBuffer();
    const audioSource = await audioContext.decodeAudioData(audioBuffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioSource;

    // キャンバスサイズの設定
    canvas.width = 800;
    canvas.height = 400;
    
    // 録画ストリームの設定
    const stream = canvas.captureStream();  // キャンバスの映像ストリーム取得
    const audioStream = audioContext.createMediaStreamDestination();  // 音声ストリーム作成
    source.connect(analyser);  // 音声をアナライザーに接続
    source.connect(audioStream);  // 音声をストリーム出力に接続
    source.connect(audioContext.destination);  // 実際のスピーカー出力に接続
    
    // 映像と音声のストリームを結合
    const combinedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...audioStream.stream.getAudioTracks()
    ]);

    // MediaRecorderの設定
    mediaRecorder = new MediaRecorder(combinedStream);
    chunks = [];

    // 録画データの保存とビデオ作成のイベントハンドラー設定
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = createVideo;

    // 録画と音声再生の開始
    mediaRecorder.start();
    source.start(0);

    // スペクトラム描画関数
    function draw() {
        if (settings.currentMode === 'spectrum') {
            drawSpectrum(minIndex, maxIndex);  // インデックスを引数として渡す
        } else {
            drawWaveform();
        }
        requestAnimationFrame(draw);
    }

    // 描画開始
    draw();

    // 音声再生終了時の処理
    source.onended = () => {
        mediaRecorder.stop();
        audioContext.close();
        analyser.disconnect();
        source.disconnect();
        chunks = [];
    };
}

// 録画データからビデオファイルを作成しダウンロードする関数
function createVideo() {
    // 録画データからBlobを作成
    const blob = new Blob(chunks, { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    
    // ダウンロードリンクの作成と自動クリック
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.mp4';
    a.click();
    
    // メモリ解放
    URL.revokeObjectURL(url);
}

// 波形描画関数を追加
function drawWaveform() {
    const timeData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(timeData);

    ctx.fillStyle = settings.waveform.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = settings.waveform.color;
    ctx.beginPath();

    const sliceWidth = canvas.width / timeData.length;
    let x = 0;
    const centerY = canvas.height / 2;  // キャンバスの中央のY座標

    for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0;  // -1.0 から 1.0 の範囲に正規化
        // 中央からの相対的な位置として計算
        const y = centerY + (v - 1) * centerY * (settings.waveform.amplitude / 100);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        x += sliceWidth;
    }

    if (settings.waveform.style === 'fill') {
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.fillStyle = settings.waveform.color;
        ctx.fill();
    } else {
        ctx.stroke();
    }
}

function drawSpectrum(minIndex, maxIndex) {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = settings.spectrum.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const frequencyRange = maxIndex - minIndex;
    const samplesPerBar = Math.floor(frequencyRange / settings.spectrum.barCount);
    
    ctx.fillStyle = settings.spectrum.barColor;
    ctx.strokeStyle = settings.spectrum.barColor;

    if (settings.spectrum.spectrumStyle === 'circular') {
        // 円形スペクトラム
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8; // 半径を設定

        ctx.beginPath();
        for(let i = 0; i < settings.spectrum.barCount; i++) {
            let sum = 0;
            const startIndex = minIndex + (i * samplesPerBar);
            const endIndex = Math.min(startIndex + samplesPerBar, maxIndex);
            
            for(let j = startIndex; j < endIndex; j++) {
                sum += dataArray[j];
            }
            
            const average = sum / samplesPerBar;
            const barHeight = (average / 255) * (radius * 0.5) * (settings.spectrum.amplitudeScale / 100); // 倍率を適用
            
            // 角度を計算（2πラジアンを均等に分割）
            const angle = (i / settings.spectrum.barCount) * Math.PI * 2;
            
            // バーの開始点と終点を計算
            const startX = centerX + (radius - barHeight) * Math.cos(angle);
            const startY = centerY + (radius - barHeight) * Math.sin(angle);
            const endX = centerX + radius * Math.cos(angle);
            const endY = centerY + radius * Math.sin(angle);
            
            // バーを描画
            ctx.lineWidth = (2 * Math.PI * radius / settings.spectrum.barCount) * (settings.spectrum.barWidthPercent / 100);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

    } else if (settings.spectrum.spectrumStyle === 'liner') {
        // 波形スタイル
        ctx.beginPath();
        ctx.lineWidth = 2;
        
        for(let i = 0; i < settings.spectrum.barCount; i++) {
            let sum = 0;
            const startIndex = minIndex + (i * samplesPerBar);
            const endIndex = Math.min(startIndex + samplesPerBar, maxIndex);
            
            for(let j = startIndex; j < endIndex; j++) {
                sum += dataArray[j];
            }
            
            const average = sum / samplesPerBar;
            const barHeight = (average / 255) * canvas.height * (settings.spectrum.amplitudeScale / 100); // 倍率を適用
            const x = (i / settings.spectrum.barCount) * canvas.width;
            
            if (i === 0) {
                ctx.moveTo(x, canvas.height - barHeight);
            } else {
                // 前のポイントとの間を曲線で結ぶ
                const prevX = ((i - 1) / settings.spectrum.barCount) * canvas.width;
                const prevY = canvas.height - (ctx.prevHeight || barHeight);
                const cpX = (x + prevX) / 2;
                ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + (canvas.height - barHeight)) / 2);
            }
            
            ctx.prevHeight = barHeight;
        }
        
        // 最後のポイントまで線を引く
        ctx.lineTo(canvas.width, canvas.height - ctx.prevHeight);
        ctx.stroke();

    } else if (settings.spectrum.spectrumStyle === 'normal') {
        // 既存の通常スタイル
        for(let i = 0; i < settings.spectrum.barCount; i++) {
            let sum = 0;
            const startIndex = minIndex + (i * samplesPerBar);
            const endIndex = Math.min(startIndex + samplesPerBar, maxIndex);
            
            for(let j = startIndex; j < endIndex; j++) {
                sum += dataArray[j];
            }
            
            const average = sum / samplesPerBar;
            const totalBarWidth = canvas.width / settings.spectrum.barCount;
            // バーの実際の幅を計算（設定された割合に基づく）
            const actualBarWidth = totalBarWidth * (settings.spectrum.barWidthPercent / 100);
            // バーの開始位置を中央揃えに調整
            const barStartX = i * totalBarWidth + (totalBarWidth - actualBarWidth) / 2;
            
            const barHeight = (average / 255) * canvas.height * (settings.spectrum.amplitudeScale / 100); // 倍率を適用
            ctx.fillRect(
                barStartX,
                canvas.height - barHeight,
                actualBarWidth,
                barHeight
            );
        }

    } else if (settings.spectrum.spectrumStyle === 'center') {
        // 既存の中央スタイル
        for(let i = 0; i < settings.spectrum.barCount; i++) {
            let sum = 0;
            const startIndex = minIndex + (i * samplesPerBar);
            const endIndex = Math.min(startIndex + samplesPerBar, maxIndex);
            
            for(let j = startIndex; j < endIndex; j++) {
                sum += dataArray[j];
            }
            
            const average = sum / samplesPerBar;
            const totalBarWidth = canvas.width / settings.spectrum.barCount;
            // バーの実際の幅を計算（設定された割合に基づく）
            const actualBarWidth = totalBarWidth * (settings.spectrum.barWidthPercent / 100);
            // バーの開始位置を中央揃えに調整
            const barStartX = i * totalBarWidth + (totalBarWidth - actualBarWidth) / 2;
            
            const barHeight = (average / 255) * (canvas.height / 2) * (settings.spectrum.amplitudeScale / 100); // 倍率を適用
            ctx.fillRect(
                barStartX,
                canvas.height/2 - barHeight,
                actualBarWidth,
                barHeight * 2
            );
        }
    }
}