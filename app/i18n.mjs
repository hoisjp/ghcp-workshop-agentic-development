export const DEFAULT_LOCALE = "ja";
export const SUPPORTED_LOCALES = new Set(["en", "ja"]);

const JAPANESE_TEXT = new Map(Object.entries({
  "Customer Orders": "顧客注文管理",
  "Customer Orders home": "顧客注文管理ホーム",
  "Language": "表示言語",
  "Workshop system": "ワークショップシステム",
  "Skip to content": "本文へ移動",
  "Primary navigation": "メインナビゲーション",
  "Dashboard": "ダッシュボード",
  "Orders": "注文",
  "Customers": "顧客",
  "Products": "商品",
  "Inventory": "在庫",
  "Shipments": "出荷",
  "Stores": "店舗",
  "Local workshop environment": "ローカルワークショップ環境",
  "SQLite | Node.js standard library": "SQLite | Node.js標準ライブラリ",
  "Operations overview": "業務概要",
  "Monitor orders, customers, products, and stock from one place.": "注文、顧客、商品、在庫を一画面で確認します。",
  "Create order": "注文を登録",
  "Key metrics": "主要指標",
  "Total orders": "注文件数",
  "Order value": "注文金額",
  "Excludes cancelled and refunded orders": "キャンセル・返金済みを除く",
  "Active customer records": "登録済み顧客",
  "Products in the catalog": "カタログ登録商品",
  "Latest activity": "最新の状況",
  "Recent orders": "最近の注文",
  "View all": "すべて表示",
  "Attention": "要確認",
  "Low inventory": "低在庫",
  "No low-stock products.": "低在庫の商品はありません。",
  "Order": "注文",
  "Customer": "顧客",
  "Placed": "注文日時",
  "Status": "状態",
  "Total": "合計",
  "Items": "商品",
  "Store": "店舗",
  "Product": "商品",
  "Units": "数量",
  "Order management": "注文管理",
  "Search orders by customer or order number and review their current status.": "顧客名または注文番号で検索し、現在の状態を確認します。",
  "Search": "検索",
  "Order number, name, or email": "注文番号、氏名、メールアドレス",
  "All statuses": "すべての状態",
  "Apply filters": "絞り込む",
  "Clear": "クリア",
  "No orders match the current filters.": "条件に一致する注文はありません。",
  "Order detail": "注文詳細",
  "Back to orders": "注文一覧へ戻る",
  "Summary": "概要",
  "Email": "メールアドレス",
  "Order total": "注文合計",
  "Workflow": "ワークフロー",
  "Move the order to its next operational state.": "注文を次の業務状態へ進めます。",
  "Next status": "次の状態",
  "Update status": "状態を更新",
  "This order has no available status transitions.": "この注文はこれ以上状態を変更できません。",
  "Line items": "注文明細",
  "Line": "明細",
  "Unit price": "単価",
  "Quantity": "数量",
  "Line total": "明細合計",
  "Shipment": "出荷",
  "Not assigned": "未割当",
  "Order created successfully.": "注文を登録しました。",
  "Order status updated successfully.": "注文状態を更新しました。",
  "Choose a customer, store, and one or more product quantities.": "顧客、店舗、1種類以上の商品数量を選択します。",
  "Cancel": "キャンセル",
  "Select a customer": "顧客を選択",
  "Fulfillment store": "出荷元店舗",
  "Select a store": "店舗を選択",
  "Catalog": "カタログ",
  "Product quantities": "商品数量",
  "Inventory is validated against the selected store when the order is submitted.": "注文登録時に、選択した店舗の在庫を確認します。",
  "Order could not be created.": "注文を登録できませんでした。",
  "Directory": "顧客台帳",
  "Customer records and their aggregate order activity.": "顧客情報と注文実績の集計です。",
  "Pricing, inventory totals, and review data stored in the product catalog.": "商品カタログの価格、在庫合計、レビュー情報です。",
  "Color": "色",
  "Not specified": "未設定",
  "Reviews": "レビュー",
  "No reviews": "レビューなし",
  "Stock control": "在庫管理",
  "Current product quantities by fulfillment store. Ten units or fewer are marked low.": "出荷元店舗別の商品在庫です。10個以下を低在庫として表示します。",
  "Available units": "利用可能数",
  "Fulfillment": "出荷管理",
  "Shipment progress, delivery destinations, and assigned order lines.": "出荷状況、配送先、割り当てられた注文明細です。",
  "Destination": "配送先",
  "Lines": "明細数",
  "No shipments found.": "出荷データはありません。",
  "Sales channels": "販売チャネル",
  "Online and physical locations that own orders and inventory.": "注文と在庫を管理するオンライン店舗および実店舗です。",
  "Page not found": "ページが見つかりません",
  "Request failed": "リクエストに失敗しました",
  "Return to dashboard": "ダッシュボードへ戻る",
  "The requested page does not exist.": "指定されたページは存在しません。",
  "An unexpected error occurred.": "予期しないエラーが発生しました。",
  "The requested order status is not valid.": "指定された注文状態は無効です。",
  "Order not found.": "注文が見つかりません。",
  "Select at least one product quantity.": "1種類以上の商品数量を指定してください。",
  "Customer not found.": "顧客が見つかりません。",
  "Store not found.": "店舗が見つかりません。",
  "Form content type is not supported.": "このフォーム形式には対応していません。",
  "The submitted form is too large.": "送信されたフォームが大きすぎます。",
  "Customer is required.": "顧客を選択してください。",
  "Store is required.": "店舗を選択してください。",
  "A product selection is not valid.": "商品の選択が無効です。",
  "Product quantities must be whole numbers from 0 to 999.": "商品数量は0から999までの整数で指定してください。",
  "Order ID is not valid.": "注文IDが無効です。",
}));

export function normalizeLocale(value) {
  return SUPPORTED_LOCALES.has(value) ? value : DEFAULT_LOCALE;
}

export function localeFromCookie(cookieHeader = "") {
  for (const part of cookieHeader.split(";")) {
    const [name, value] = part.trim().split("=", 2);
    if (name === "workshop_language") {
      return normalizeLocale(value);
    }
  }
  return DEFAULT_LOCALE;
}

function translateDynamicText(text) {
  if (text.includes(" | ")) {
    return text.split(" | ").map((part) => (
      JAPANESE_TEXT.get(part) ?? translateDynamicText(part)
    )).join(" | ");
  }

  let match = text.match(/^(\d+) currently open$/);
  if (match) return `未処理 ${match[1]}件`;

  match = text.match(/^(\d+) orders?$/);
  if (match) return `${match[1]}件の注文`;

  match = text.match(/^(\d+) item types?$/);
  if (match) return `${match[1]}種類`;

  match = text.match(/^(\d+) units$/);
  if (match) return `${match[1]}個`;

  match = text.match(/^Product #(\d+)$/);
  if (match) return `商品 #${match[1]}`;

  match = text.match(/^Customer #(\d+)$/);
  if (match) return `顧客 #${match[1]}`;

  match = text.match(/^Store #(\d+)$/);
  if (match) return `店舗 #${match[1]}`;

  match = text.match(/^Order #(\d+)$/);
  if (match) return `注文 #${match[1]}`;

  match = text.match(/^Quantity for (.+)$/);
  if (match) return `${match[1]}の数量`;

  match = text.match(/^Placed (.+) at (.+)\.$/);
  if (match) return `${match[1]}、${match[2]}で注文`;

  match = text.match(/^(.+) has only (\d+) units available at this store\.$/);
  if (match) return `${match[1]}のこの店舗での在庫は${match[2]}個です。`;

  match = text.match(/^Order status cannot change from (.+) to (.+)\.$/);
  if (match) return `注文状態を${match[1]}から${match[2]}へ変更できません。`;

  return text;
}

function translateText(text) {
  const leading = text.match(/^\s*/)?.[0] ?? "";
  const trailing = text.match(/\s*$/)?.[0] ?? "";
  const trimmed = text.trim();
  if (!trimmed) return text;
  return `${leading}${JAPANESE_TEXT.get(trimmed) ?? translateDynamicText(trimmed)}${trailing}`;
}

export function localizeHtml(html, locale) {
  if (locale !== "ja") return html;

  return html
    .replace('<html lang="en">', '<html lang="ja">')
    .replace(/>([^<>]+)</g, (match, text) => `>${translateText(text)}<`)
    .replace(/(aria-label|placeholder)="([^"]+)"/g, (match, name, value) => (
      `${name}="${translateText(value)}"`
    ));
}

export function formatDateTime(value, locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

const JAPANESE_STATUS = {
  OPEN: "受付中",
  PAID: "支払済み",
  SHIPPED: "出荷済み",
  COMPLETE: "完了",
  CANCELLED: "キャンセル済み",
  REFUNDED: "返金済み",
  CREATED: "作成済み",
  "IN-TRANSIT": "配送中",
  DELIVERED: "配達済み",
};

export function statusLabel(status, locale) {
  return locale === "ja" ? JAPANESE_STATUS[status] ?? status : status;
}
