# 会議文字起こし分析ツール

LangChainを使用して会議の文字起こしを分析し、商談かその他のミーティングかを判定して、適切な情報をJSON形式で抽出するツールです。

## 機能

### 1. 会議種別の自動判定
- 文字起こしテキストから「商談」か「その他のミーティング」かを自動判定

### 2. 商談の場合の情報抽出
以下の情報をJSON形式で抽出します：
- **関係構築とヒアリング**
  - 会議の参加者
  - 顧客のプロフィール
  - 現状の顧客の課題、ニーズ、目標
  - 今行っている取り組みやその成果・課題など
  - 過去に行なってきた取り組みやその結果
  - KPI（重要業績評価指標）や最終的なゴールなど
  - 次回のスケジュール

- **課題解決の提案とデモンストレーション**
  - BANT情報
  - 商材の紹介に対しての反応
  - 商材を導入する際、顧客が懸念すること
  - 次回のスケジュール

- **商談詳細の詰めと見積もりの提示**
  - 価格（例えば、何円か、レベニューシェアなのか、買い切りなのか）
  - 次回のスケジュール

- **クロージング（契約締結）**
  - 最終的契約内容の確認
  - このミーティングの後やるべきこと

### 3. その他のミーティングの場合の情報抽出
以下の情報をJSON形式で抽出します：
- 会議の論点
- 結論
- 次やるTodo

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env`ファイルを作成し、以下の内容を設定してください：

```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

### 3. 環境変数の確認
```bash
# .envファイルの内容を確認
npm run check-env
```

## 使用方法

### 1. コマンドラインからファイルを指定して実行

#### 基本的な使用方法
```bash
node generate_summarization.js <ファイルパス>
```

#### 提供されているサンプルファイルを使用
```bash
# 商談のサンプルを分析
node generate_summarization.js sample_sales.txt

# 一般ミーティングのサンプルを分析
node generate_summarization.js sample_meeting.txt
```

#### 独自の文字起こしファイルを分析
```bash
node generate_summarization.js your_transcript.txt
```

#### 結果をファイルに保存
```bash
SAVE_RESULT=true node generate_summarization.js sample_sales.txt
```

### 2. プログラムから関数を呼び出し

```javascript
import { generateMeetingSummary } from './generate_summarization.js';

const transcriptText = `
営業担当の田中です。本日はお時間をいただき、ありがとうございます。
御社の売上向上についてご相談させていただきたいと思います。
現在、どのような課題をお抱えでしょうか？

顧客：売上が伸び悩んでいて、新規顧客の獲得に苦戦しています。
予算は月額50万円程度を考えています。

営業：承知いたしました。弊社のマーケティングツールをご紹介させていただきます。
導入事例では、3ヶ月で新規顧客数が30%増加した実績があります。
`;

generateMeetingSummary(transcriptText)
    .then(result => {
        console.log("分析結果:", JSON.stringify(result, null, 2));
    })
    .catch(error => {
        console.error("エラー:", error);
    });
```

### 3. 使用例

#### ヘルプの表示
```bash
node generate_summarization.js
```

#### サンプルファイルの分析
```bash
# 商談の分析
node generate_summarization.js sample_sales.txt

# 一般ミーティングの分析
node generate_summarization.js sample_meeting.txt
```

### 出力例

#### 商談の場合
```json
{
  "meetingType": "商談",
  "extractedInfo": {
    "関係構築とヒアリング": {
      "会議の参加者": ["営業担当の田中", "顧客"],
      "顧客のプロフィール": null,
      "現状の顧客の課題": ["売上の伸び悩み", "新規顧客の獲得に苦戦"],
      "今行っている取り組み": null,
      "過去の取り組み": null,
      "KPI": null,
      "次回のスケジュール": null
    },
    "課題解決の提案とデモンストレーション": {
      "BANT情報": {
        "Budget": "月額50万円程度",
        "Authority": null,
        "Need": "新規顧客獲得",
        "Timeline": null
      },
      "商材の紹介に対しての反応": null,
      "顧客の懸念": null,
      "次回のスケジュール": null
    }
  },
  "timestamp": "2025-09-25T12:00:00.000Z"
}
```

#### その他のミーティングの場合
```json
{
  "meetingType": "その他のミーティング",
  "extractedInfo": {
    "会議の論点": ["プロジェクトの進捗確認", "次週の作業計画"],
    "結論": ["現在の進捗は順調", "来週までにテスト環境を構築"],
    "次やるTodo": [
      "テスト環境の構築",
      "ユーザーテストの実施",
      "バグ修正"
    ]
  },
  "timestamp": "2025-09-25T12:00:00.000Z"
}
```

## 注意事項

- OpenAI APIキーが必要です
- インターネット接続が必要です
- 文字起こしテキストの品質によって抽出精度が変わります
- 長いテキストの場合、処理に時間がかかる場合があります

## エラーハンドリング

関数は以下のような場合にエラー情報を返します：
- API接続エラー
- JSON解析エラー
- その他の予期しないエラー

エラーが発生した場合、結果オブジェクトに`error`フィールドが含まれます。
