
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

# GitHub Copilot 利用ログ

GitHub Copilot でユーザーの依頼を処理するたびに、ワークスペースルートの `tmp/ghcp.log` へ1件追記する。

- 作業開始時に開始日時を記録し、応答を完了する直前に終了日時と経過時間を算出する。
- ログが存在しない場合は `tmp` ディレクトリとログを作成する。既存ログは上書きしない。
- ログには次の項目を必ず含める。
  - `Prompt`: ユーザーが与えたプロンプト。添付ファイルの全文ではなく、ユーザーが入力した依頼文を記録する。
  - `Summary`: 実施内容、変更した主なファイル、検証結果を簡潔にまとめる。回答だけの場合は回答の要点を記録する。
  - `Started at`、`Finished at`、`Duration`: 開始日時、終了日時、実行時間（ISO 8601、タイムゾーン付き、およびミリ秒）を同じリスト1行に記録する。
- 各エントリは、次の形式で空行を挟んで追記する。`Prompt` は複数行を保持できるようテキストのコードブロックに記録する。

  ````markdown
  ## <started_at>
  - Started at: <started_at> | Finished at: <finished_at> | Duration: <duration_ms> ms
  - Prompt: <prompt>
  - Summary: <summary>
  ````
- ログの追記自体は `summary` の変更ファイル一覧に含めない。
- ログへの追記に失敗した場合は、最終回答でその旨を短く通知する。