# ワークショップ事前準備ガイド

## 1. このガイドの目的

ワークショップ開始前に、GitHub Copilotと注文管理アプリケーションをローカル環境で利用できる状態にする。

準備完了の条件は次の4点である。

1. Visual Studio CodeでGitHub Copilot Chatを開ける。
2. Node.js 22.13以降を実行できる。
3. `npm run verify`が失敗0件で完了する。
4. `http://127.0.0.1:3000`で注文管理画面を表示できる。

## 2. 対応環境

- Windows 11
- macOS
- Linux

本ガイドではWindowsとmacOSの手順を説明する。コマンドは特記がない限り、Windows PowerShell、Windowsコマンドプロンプト、macOSのターミナルで共通である。

## 3. 事前に用意するもの

| 項目 | 要件 | 用途 |
|---|---|---|
| GitHubアカウント | GitHub Copilotを利用できるアカウント | Copilot ChatとAgent modeの利用 |
| Visual Studio Code | 最新の安定版 | リポジトリの閲覧と演習 |
| Git | 最新の安定版を推奨 | リポジトリの取得と変更差分の確認 |
| Node.js | 22.13以降、24 LTS推奨 | WebアプリとSQLiteの実行 |
| Webブラウザー | Edge、Chrome、Safariなどの最新版 | 注文管理画面の確認 |
| インターネット接続 | GitHubとGitHub Copilotへ接続可能 | リポジトリ取得、サインイン、Copilot利用 |

ワークショップ当日の準備負担を減らすため、事前インストールが必要なソフトウェアは上記の表に極力絞っている。次のソフトウェアは参加者環境には不要である。

- SQLite CLI
- DockerまたはPodman
- Oracle Database
- Java、Python、.NET SDK
- 外部npmパッケージ

このリポジトリはNode.js標準機能だけを使用するため、`npm install`と`npm ci`も不要である。

## 4. Windowsでのインストール

### 4.1 Visual Studio Code

1. [Visual Studio Code](https://code.visualstudio.com/Download)からWindows用User Installerをダウンロードする。
2. インストーラーを実行する。
3. セットアップ項目に「PATHへの追加」が表示された場合は有効にする。
4. インストール後、Visual Studio CodeとPowerShellを開き直す。

### 4.2 Git

1. [Git for Windows](https://git-scm.com/download/win)からインストーラーをダウンロードする。
2. 特別な社内指定がなければ、インストーラーの既定値を使用する。
3. PowerShellを開き直し、次を実行する。

```powershell
git --version
```

バージョン番号が表示されれば準備完了である。

### 4.3 Node.js

1. [Node.js公式ダウンロードページ](https://nodejs.org/en/download)からNode.js 24 LTSのWindows Installer（`.msi`）をダウンロードする。
2. インストーラーを既定値で実行する。npmも同時にインストールされる。
3. Visual Studio CodeとPowerShellを開き直す。
4. 次を実行する。

```powershell
node --version
npm --version
```

`node --version`が`v22.13.0`以上であれば利用できる。Node.js 24 LTSを推奨する。

## 5. macOSでのインストール

### 5.1 Visual Studio Code

1. [Visual Studio Code](https://code.visualstudio.com/Download)からmacOS用をダウンロードする。
2. Visual Studio CodeをApplicationsフォルダーへ移動して起動する。
3. `code`コマンドも使用する場合は、コマンドパレットで`Shell Command: Install 'code' command in PATH`を実行する。

`code`コマンドは便利だが、ワークショップの必須要件ではない。

### 5.2 Git

ターミナルで次を実行する。

```bash
git --version
```

バージョン番号が表示されれば追加作業は不要である。Gitがない場合は、表示される案内に従ってApple Command Line Toolsを導入するか、組織で指定された方法で[Git](https://git-scm.com/download/mac)をインストールする。

### 5.3 Node.js

1. [Node.js公式ダウンロードページ](https://nodejs.org/en/download)からNode.js 24 LTSのmacOS Installer（`.pkg`）をダウンロードする。
2. インストーラーを実行する。
3. Visual Studio Codeとターミナルを開き直す。
4. 次を実行する。

```bash
node --version
npm --version
```

`node --version`が`v22.13.0`以上であれば利用できる。Node.js 24 LTSを推奨する。

## 6. GitHub Copilotの準備

1. Visual Studio Codeを起動する。
2. Extensionsビューで`GitHub Copilot`を検索し、GitHub提供の拡張機能をインストールまたは有効化する。
3. Visual Studio Code右上またはアカウントメニューからGitHubへサインインする。
4. ワークショップで利用するGitHub Copilotライセンスが付与されたアカウントを選ぶ。
5. Chatビューを開き、Agent modeを選択できることを確認する。

確認用として、リポジトリを開いた後に次の質問を送信できる。

```text
このリポジトリの目的をREADMEに基づいて3点で説明してください。ファイルは変更しないでください。
```

回答が得られれば準備完了である。Agent modeが表示されない場合は、次を確認する。

- GitHub Copilot拡張機能が有効である。
- 正しいGitHubアカウントへサインインしている。
- GitHub Copilotライセンスが付与されている。
- 組織のポリシーでChatまたはAgent modeが許可されている。
- Visual Studio Codeと拡張機能が最新である。

## 7. リポジトリの取得

講師から案内されたGitHubリポジトリをブラウザーで開き、`Code`からHTTPSのURLをコピーする。その後、作業用ターミナルで次を実行する。

```bash
git clone <copied-repository-url>
cd ghcp-workshop-agentic-development
code .
```

`code`コマンドを利用できない場合は、Visual Studio Codeの`File`、`Open Folder`から`ghcp-workshop-agentic-development`フォルダーを開く。

社内ポリシーなどによりGitを利用できない場合は、GitHubの`Code`、`Download ZIP`から取得して展開できる。ただし、変更差分の確認を含む演習ではGitによるcloneを推奨する。

リポジトリは、書き込み可能なローカルフォルダーへ配置する。ネットワークドライブや同期処理によるファイルロックが発生するフォルダーは避ける。

## 8. 環境の検証

Visual Studio Codeでリポジトリを開き、`Terminal`、`New Terminal`からターミナルを起動する。ターミナルの現在位置がリポジトリ直下であることを確認して、次を実行する。

```bash
npm run verify
```

このコマンドは次の処理を行う。

1. `database/sqlite/schema.sql`と`seed.sql`からSQLite DBを再生成する。
2. DB整合性と外部キーを検証する。
3. DB、HTTP画面、注文登録、在庫引当、状態更新の自動テストを実行する。

成功時はテスト結果の最後に失敗0件が表示される。初期データは次の件数になる。

| データ | 件数 |
|---|---:|
| 顧客 | 3 |
| 商品 | 3 |
| 注文 | 3 |
| 注文明細 | 5 |

`npm run verify`はローカルDBを初期状態へ戻す。演習中に作成した注文を残したい場合は実行しない。

## 9. アプリケーションの起動確認

リポジトリ直下で次を実行する。

```bash
npm start
```

次のメッセージが表示されれば起動に成功している。

```text
Customer Orders is running at http://127.0.0.1:3000
Press Ctrl+C to stop the server.
```

ブラウザーで次のURLを開く。

- 注文管理画面: [http://127.0.0.1:3000](http://127.0.0.1:3000)
- ヘルスチェック: [http://127.0.0.1:3000/health](http://127.0.0.1:3000/health)

ダッシュボードに注文3件と注文金額`$212.20`が表示されれば確認完了である。ヘルスチェックでは次のJSONが表示される。

```json
{"status":"ok","database":"ok"}
```

終了するには、アプリケーションを実行しているターミナルでCtrl+Cを押す。

`npm start`は起動前にDBを初期化する。登録済みデータを維持して再起動する場合は、次を使用する。

```bash
npm run app:start
```

## 10. ワークショップ前チェックリスト

開催前日までに次を確認する。

- [ ] Visual Studio Codeを起動できる。
- [ ] ワークショップ用のGitHubアカウントでGitHub Copilot Chatを利用できる。
- [ ] ChatビューでAgent modeを選択できる。
- [ ] `git --version`でバージョンが表示される。
- [ ] `node --version`が`v22.13.0`以上である。
- [ ] `npm --version`でバージョンが表示される。
- [ ] リポジトリをローカルへ取得済みである。
- [ ] `npm run verify`が失敗0件で完了する。
- [ ] `npm start`で注文管理画面を表示できる。
- [ ] 起動確認後にCtrl+Cでサーバーを停止した。

## 11. トラブルシューティング

### `node`または`npm`が見つからない

Visual Studio Codeとターミナルをすべて閉じて開き直す。それでも解決しない場合はNode.jsを再インストールし、インストール先がPATHに追加されていることを確認する。

### Node.jsのバージョンが古い

Node.js 24 LTSへ更新する。このアプリケーションはNode.js標準の`node:sqlite`を使用するため、22.13未満では動作しない。

### Windows PowerShellで`npm.ps1`を実行できない

組織の実行ポリシーを変更せず、次のように`npm.cmd`を使用する。

```powershell
npm.cmd run verify
npm.cmd start
```

### `Database not found`と表示される

次を実行してDBを生成する。

```bash
npm run db:init
```

その後、データを維持して起動する場合は`npm run app:start`を実行する。

### 3000番ポートが使用中である

macOSでは次を実行する。

```bash
PORT=3001 npm run app:start
```

Windows PowerShellでは次を実行する。

```powershell
$env:PORT=3001
npm run app:start
```

その後、`http://127.0.0.1:3001`を開く。

### ブラウザーで画面を開けない

- ターミナルに起動完了メッセージが表示されていることを確認する。
- `npm start`を実行したターミナルを閉じていないことを確認する。
- URLが`http://127.0.0.1:3000`であることを確認する。
- VPNやセキュリティソフトがlocalhost接続を遮断していないか確認する。

### GitHub Copilotへ接続できない

- ブラウザーとVisual Studio Codeの両方で正しいGitHubアカウントへサインインし直す。
- 組織のプロキシ、ファイアウォール、SSL検査の設定を管理者へ確認する。
- GitHub Copilotの利用が組織ポリシーで許可されているか確認する。

### 解決しない場合に共有する情報

パスワードやトークンを含めず、講師または環境管理者へ次を共有する。

- OS名とバージョン
- `node --version`、`npm --version`、`git --version`の結果
- 実行したコマンド
- 表示されたエラーメッセージ全文

## 12. 追加資料

- [README](../README.md)
- [アプリケーションの前提要件](application-requirements.md)
- [データベース実行環境の設計](database-runtime-design.md)
- [ワークショップ進行](../workshop-guide.md)
