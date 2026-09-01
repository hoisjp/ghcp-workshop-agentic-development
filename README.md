# GitHub Copilot Agentic Development Workshop

GitHub Copilotを使い、既存の注文管理システムを理解、文書化、変更設計、実装、レビュー、テストするためのワークショップ教材です。

## 必要な環境

- Visual Studio Code
- GitHub Copilotを利用できるアカウント
- Node.js 22.13以降（Node.js 24 LTS推奨）

SQLiteはNode.jsに組み込まれた機能を使用するため、SQLite CLI、Docker、Oracle Database、追加のnpmパッケージは不要です。

初めて環境を準備する場合は、OS別のインストール、GitHub Copilotへのサインイン、動作確認、トラブルシューティングをまとめた [ワークショップ事前準備ガイド](docs/setup-guide.md) を参照してください。

## Webアプリケーションの起動

macOS、Windows PowerShell、Windowsコマンドプロンプトで同じコマンドを使用できます。

1. このリポジトリをVS Codeで開きます。
2. ターミナルで `npm start` を実行します。
3. ブラウザーで [http://127.0.0.1:3000](http://127.0.0.1:3000) を開きます。

`npm start`はデータベースを初期状態へ戻してからアプリケーションを起動します。登録したデータを残したまま再起動する場合は、`npm run app:start`を使用します。終了するにはターミナルでCtrl+Cを押します。

アプリケーションでは次の操作を確認できます。

- 日本語（既定）と英語の表示切替
- 注文、注文金額、顧客、商品、低在庫のダッシュボード表示
- 注文一覧のキーワード・状態検索と注文詳細表示
- 在庫を検証した注文登録と在庫引当
- 定義済みワークフローに従う注文状態更新
- 顧客、商品、店舗別在庫、出荷、店舗の一覧表示

表示言語は画面右上の「日本語」「English」から切り替えます。選択した言語はブラウザーに保存され、次回の画面表示でも維持されます。

機能と業務ルールの前提は [docs/application-requirements.md](docs/application-requirements.md) を参照してください。

## SQLiteデータベースだけを操作する

画面を起動せず、SQLite版の初期化とクエリだけを確認する場合は次のコマンドを使用します。

1. `npm run db:init`を実行します。
2. `npm run db:query`を実行します。

初期化に成功すると、ローカルの `data/workshop.db` にデータベースが作成されます。SQLiteは組み込みデータベースであり、別途常駐サーバーを起動する必要はありません。

任意の読み取りクエリも実行できます。

    npm run db:query -- "SELECT order_id, order_status FROM orders ORDER BY order_id"

初期状態へ戻す場合は、再度 `npm run db:init` を実行します。既存のローカルDBは置き換えられます。

初期化、整合性、代表的な集計結果をまとめて確認する場合は `npm run verify` を実行します。

## データベース構成

- SQLite版: 参加者の通常演習、アプリケーション起動、基本CRUD、自動テスト
- Oracle版: Oracle SQLおよびPL/SQLの静的解析、講師デモ、発展演習

両者はテーブル名、列名、キー、主要データIDをそろえた「同じ論理データモデル」としますが、同じDDLや同じ実行結果を保証する互換環境ではありません。詳細は [docs/database-runtime-design.md](docs/database-runtime-design.md) を参照してください。

## 主なファイル

- [workshop-guide.md](workshop-guide.md): ワークショップの進行
- [docs/setup-guide.md](docs/setup-guide.md): 参加者向けのインストールと事前動作確認
- [docs/application-requirements.md](docs/application-requirements.md): アプリケーションの前提要件と業務ルール
- [app/index.mjs](app/index.mjs): Webサーバーの起動処理
- [app/server.mjs](app/server.mjs): HTTPルーティングと入力処理
- [app/database.mjs](app/database.mjs): SQLと注文業務処理
- [app/views.mjs](app/views.mjs): サーバー描画HTML
- [public/styles.css](public/styles.css): 画面スタイル
- [database/sqlite/schema.sql](database/sqlite/schema.sql): SQLite用DDL
- [database/sqlite/seed.sql](database/sqlite/seed.sql): 教材用サンプルデータ
- [scripts/init-db.mjs](scripts/init-db.mjs): DB初期化処理
- [scripts/query-db.mjs](scripts/query-db.mjs): 読み取りクエリ実行処理
- [test/database.test.mjs](test/database.test.mjs): DB整合性と代表クエリのテスト
- [test/application.test.mjs](test/application.test.mjs): HTTP画面、注文登録、在庫引当、状態更新のテスト

GitHub Actionsでは、Windows、macOS、Linuxのそれぞれで `npm run verify` を実行します。

## トラブルシューティング

- `node:sqlite`が見つからない場合: `node --version`を確認し、Node.js 22.13以降へ更新します。
- DBが存在しない場合: `npm run db:init`を先に実行します。
- 外部キーエラーが発生した場合: 教材では接続時に外部キー検証を有効化しています。参照先データと投入順を確認します。
- 3000番ポートが使用中の場合: macOS／Linuxでは `PORT=3001 npm run app:start`、Windows PowerShellでは `$env:PORT=3001; npm run app:start`のように別ポートを指定します。