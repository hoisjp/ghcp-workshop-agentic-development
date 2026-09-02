# デザイン規約とスターターテンプレート

`vibe-coding` スキルで生成する HTML アプリの見た目を、素の HTML に見えないレベルに引き上げるための規約。

## 原則

- **ダークとライトの両対応**: `prefers-color-scheme` で自動切替。トークンは CSS カスタムプロパティで一元管理
- **システムフォント**: Web フォントは読み込まない。`-apple-system` から始まるスタックで OS ネイティブの見え方にする
- **8px グリッド**: 余白・間隔は 4/8/12/16/24/32/48 のみ使う
- **角丸と影は控えめに**: カードは `border-radius: 14px`、影は 1 段のみ。多重の強い影は使わない
- **色は 1 アクセント + 状態色**: アクセント色は 1 つ。警告・危険・成功は状態表現にだけ使う
- **情報密度**: テーブルの行高 44px 前後、数値は右揃え + `font-variant-numeric: tabular-nums`
- **アクセシビリティ**: 本文コントラスト比 4.5:1 以上、`:focus-visible` のリング、`aria-sort`、`prefers-reduced-motion`
- **レスポンシブ**: 最大幅 1200px 中央寄せ、KPI は `repeat(auto-fit, minmax(200px, 1fr))` のグリッド

## 使ってよい表現

- グラデーションは背景に極薄く 1 箇所だけ（`radial-gradient` のアクセント）
- 状態バッジ（pill 型、薄い背景色 + 濃い文字色）
- インライン SVG のスパークライン / 横棒バー（`<div>` の幅 % でも可）
- `position: sticky` のテーブルヘッダ
- `transition: 120ms ease` 程度の控えめなホバー

## 避ける表現

- 虹色グラデーション、強いネオン、過度なアニメーション
- 絵文字をアイコン代わりに多用する（アイコンが必要なら inline SVG）
- 中央寄せの巨大ヒーロー領域（業務ダッシュボードでは情報量を優先）

## トークン（そのまま貼って使う）

```css
:root {
  color-scheme: light dark;
  --bg: #f6f7f9;
  --surface: #ffffff;
  --surface-2: #f0f2f5;
  --border: #e3e6ea;
  --text: #1a1d21;
  --text-muted: #61686f;
  --accent: #2f6feb;
  --accent-soft: #e7efff;
  --ok: #1a7f4b;
  --ok-soft: #e3f5eb;
  --warn: #9a6200;
  --warn-soft: #fdf1dc;
  --danger: #b3261e;
  --danger-soft: #fdeceb;
  --shadow: 0 1px 2px rgba(16, 24, 40, .06), 0 8px 24px rgba(16, 24, 40, .06);
  --radius: 14px;
  --space: 8px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f1216;
    --surface: #171b21;
    --surface-2: #1e242b;
    --border: #2a313a;
    --text: #e8ebee;
    --text-muted: #99a2ac;
    --accent: #6ea1ff;
    --accent-soft: #1b2740;
    --ok: #5cd39a;
    --ok-soft: #14301f;
    --warn: #f0b45e;
    --warn-soft: #33260f;
    --danger: #ff7b72;
    --danger-soft: #3a1a18;
    --shadow: 0 1px 2px rgba(0, 0, 0, .4), 0 8px 24px rgba(0, 0, 0, .35);
  }
}

* { box-sizing: border-box; }

body {
  margin: 0;
  padding: 24px 16px 64px;
  background:
    radial-gradient(1200px 400px at 50% -200px, var(--accent-soft), transparent),
    var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP",
    "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.wrap { max-width: 1200px; margin: 0 auto; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin: 16px 0 24px;
}

.kpi-value {
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -.02em;
  font-variant-numeric: tabular-nums;
}

.kpi-label { color: var(--text-muted); font-size: 12px; }

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
}

input, select, button {
  font: inherit;
  color: inherit;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
}

button { cursor: pointer; transition: background 120ms ease, border-color 120ms ease; }
button:hover { background: var(--surface-2); }
button[aria-pressed="true"] { background: var(--accent-soft); border-color: var(--accent); }

:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

table { width: 100%; border-collapse: separate; border-spacing: 0; }

th, td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  text-align: left;
}

thead th {
  position: sticky;
  top: 0;
  background: var(--surface);
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

th[aria-sort="ascending"]::after { content: " ▲"; color: var(--accent); }
th[aria-sort="descending"]::after { content: " ▼"; color: var(--accent); }

td.num { text-align: right; font-variant-numeric: tabular-nums; }
tbody tr:hover { background: var(--surface-2); }

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.badge.ok     { background: var(--ok-soft);     color: var(--ok); }
.badge.warn   { background: var(--warn-soft);   color: var(--warn); }
.badge.danger { background: var(--danger-soft); color: var(--danger); }

.bar { height: 6px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.bar > span { display: block; height: 100%; background: var(--accent); }

.empty { padding: 48px; text-align: center; color: var(--text-muted); }

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
```

## JavaScript の骨組み

```html
<script>
  const DATA = [ /* ダミーデータをここに埋め込む */ ];

  const state = { sortKey: 'name', sortDir: 'asc', query: '', filter: 'all' };

  const view = () => DATA
    .filter(r => state.filter === 'all' || r.status === state.filter)
    .filter(r => r.name.includes(state.query))
    .sort((a, b) => {
      const [x, y] = [a[state.sortKey], b[state.sortKey]];
      const c = typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'ja');
      return state.sortDir === 'asc' ? c : -c;
    });

  function render() {
    const rows = view();
    renderKpis(rows);
    renderTable(rows);
  }

  document.querySelector('thead').addEventListener('click', (e) => {
    const key = e.target.closest('th')?.dataset.key;
    if (!key) return;
    state.sortDir = state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc';
    state.sortKey = key;
    render();
  });

  render();
</script>
```

セルへの値の設定は `td.textContent = value` を使う。文字列連結した HTML を `innerHTML` に入れない。
