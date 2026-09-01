# データベース実行環境の設計

## 1. 目的

ワークショップ参加者がmacOSまたはWindowsで短時間に環境を準備できることと、既存Oracle／PL/SQL資産を解析する題材としての現実性を両立する。

## 2. 採用方針

参加者向けの既定ランタイムにはSQLiteを使用し、Oracle Databaseは講師デモと発展演習に限定する。

| 用途 | 実行環境 | 対象者 |
|---|---|---|
| アプリケーション起動、基本CRUD、自動テスト | SQLite | 全参加者 |
| Oracle SQL／PL/SQLの読解と影響分析 | ソースコードのみ | 全参加者 |
| PL/SQLのコンパイルと実行確認 | Oracle AI Database Free Lite | 講師・希望者 |

SQLiteはOracleの互換実装ではない。両環境で共有する対象は、テーブル名、列名、主キー、外部キー、主要データIDからなる論理データモデルである。

## 3. SQLite版の責務

- 顧客、店舗、商品、注文、注文明細、出荷、在庫のリレーションを再現する。
- 主キー、外部キー、`UNIQUE`、`NOT NULL`、基本的な`CHECK`制約を保持する。
- 注文一覧、注文合計、商品別売上など、ワークショップで使用する基本クエリを実行する。
- コンテナーと外部DBサーバーなしで、macOS／Windowsのどちらからも初期化できるようにする。
- DBファイルを成果物の正本にせず、DDLとシードから同じ初期状態を再生成する。

## 4. Oracle版に残す責務

- PL/SQL package、procedure、functionおよびOracle固有triggerを実行する。
- Oracle固有の例外処理、ロック、トランザクション、型変換を検証する。
- `LISTAGG`、`JSON_TABLE`、`GROUPING SETS`などのOracle固有SQLを検証する。
- 本番移行を想定した互換性、性能、実行計画を検証する。

これらをSQLiteの結果だけで正しいと判定してはならない。

## 5. 主な差異

| Oracle | SQLite版での表現 |
|---|---|
| `VARCHAR2` | `TEXT` |
| `NUMBER(10,2)` | `REAL`と値域チェック（教材用途） |
| `DATE`／`TIMESTAMP` | ISO 8601形式の`TEXT` |
| Identity列 | `INTEGER PRIMARY KEY` |
| BLOB内のJSON | `TEXT`と`json_valid()`チェック |
| `LISTAGG` | `group_concat()` |
| `JSON_TABLE` | `json_each()` |
| `GROUPING SETS` | 個別集計または`UNION ALL` |
| PL/SQL | SQLiteでは実行しない |

金額に浮動小数点型を使うのは教材の単純化である。実システムでは通貨の最小単位を整数で保持する方法や、利用DBの固定精度型を選定する。

## 6. ディレクトリ分離

- `database/sqlite/`: 参加者が実行するSQLite用DDLとシード
- `database/oracle/`: 今後追加するOracle用DDL、PL/SQL、コンテナー起動定義
- `app/`: Node.js標準機能によるHTTP処理、SQL、業務ルール、サーバー描画
- `public/`: Web画面の静的スタイル
- `scripts/`: OSに依存しないNode.jsの初期化・照会処理
- `data/`: ローカルで生成するDBファイル。Git管理対象外

Oracle DDLからSQLite DDLを当日に自動変換しない。変換済みDDLをレビューして固定し、両環境のテストを独立して行う。

## 7. 運用上の注意

- SQLite接続ごとに外部キー検証を有効にする。
- スキーマ変更時はOracle版とSQLite版の対応表を更新する。
- 共通のテストデータでは主要IDと期待される業務結果をそろえる。
- PL/SQL変更の最終確認はOracle環境で行う。
- Oracle環境が利用できなくても、SQLite版でワークショップを継続できるようにする。