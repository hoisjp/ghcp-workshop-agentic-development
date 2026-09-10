
# Chat の出力形式

- すべての Chat の回答は、簡潔な日本語で出力する。
- ユーザーに表示する reasoning / thinking / analysis / plan がある場合、それらも日本語で記述してください。
- コード、コマンド、API 名、製品名、識別子など、英語のままにすべき技術要素は翻訳しないでください。

# 現行システム分析ドキュメント

既存システムの理解・調査・棚卸し結果をドキュメント化する場合は、必ず `.github/skills/system-analysis-documentation/SKILL.md` を読み、その手順と記述規則に従う。

# Part 2 注文管理システム演習

注文管理システムの分析、設計、実装では、次の制約を常に守る。

- DBは固有の教材資産として扱い、テーブル、列、制約、ビュー、DDL、seedを変更しない。実行時のDDLやマイグレーションによる変更も行わない。
- 変更対象はアプリケーションと追加テストに限定する。既存の`order_total`は商品小計のままとし、既存集計とDBテストの期待値を保持する。
- ユーザーから実装を明示的に依頼されるまでは分析と設計だけを行い、アプリケーションとテストを変更しない。
- 現行分析は`docs/system-analysis.md`に集約する。変更設計、受け入れ条件、ワイヤーフレーム、実装タスクは`docs/shipping-estimate-design.md`にまとめる。
- 共通の`ApplicationError`は`app/errors.mjs`だけに定義し、利用するモジュールから直接importする。機能モジュール間で再exportや相互importを行わず、依存関係を一方向に保つ。
- 作業開始前に`npm test`で基準結果を確認する。DBが未準備の場合に限り`npm run db:init`を実行する。
- `npm start`と`npm run verify`はDBを初期化するため、登録データを残す場合は`npm run app:start`と`npm test`を使う。
