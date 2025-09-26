import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config();

/**
 * .envファイルの内容をconsole.logで出力する関数
 */
function logEnvFile() {
    console.log("=".repeat(50));
    console.log(".envファイルの内容:");
    console.log("=".repeat(50));
    
    // 環境変数の一覧を取得して表示
    const envVars = [
        'OPENAI_API_KEY',
        'OPENAI_MODEL',
        'SAVE_RESULT'
    ];
    
    envVars.forEach(key => {
        const value = process.env[key];
        if (value) {
            // APIキーなどの機密情報は一部をマスク
            if (key.includes('API_KEY') || key.includes('SECRET')) {
                const maskedValue = value.length > 8 
                    ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
                    : '***';
                console.log(`${key}=${maskedValue}`);
            } else {
                console.log(`${key}=${value}`);
            }
        } else {
            console.log(`${key}=未設定`);
        }
    });
    
    console.log("=".repeat(50));
}

/**
 * 会議の種類を判定する関数
 * @param {string} transcriptText - 文字起こしテキスト
 * @returns {Promise<string>} - "商談" または "その他のミーティング"
 */
async function classifyMeetingType(transcriptText) {
    const model = new ChatOpenAI({
        modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });

    const classificationPrompt = `
以下の文字起こしテキストを分析して、これが「商談」なのか「その他のミーティング」なのかを判定してください。

判定基準：
- 商談：営業活動、製品・サービスの紹介、価格交渉、契約に関する話し合い、顧客のニーズヒアリング、提案活動など
- その他のミーティング：社内会議、プロジェクト進捗会議、技術的な議論、一般的な打ち合わせなど

回答は「商談」または「その他のミーティング」のどちらかで答えてください。

文字起こしテキスト：
{transcript}
`;

    const prompt = PromptTemplate.fromTemplate(classificationPrompt);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const result = await chain.invoke({ transcript: transcriptText });
    return result.trim();
}

/**
 * 商談の場合の情報抽出
 * @param {string} transcriptText - 文字起こしテキスト
 * @returns {Promise<Object>} - 抽出された情報のJSONオブジェクト
 */
async function extractSalesInfo(transcriptText) {
    const model = new ChatOpenAI({
        modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });

    const salesPrompt = `
    以下の商談の文字起こしテキストから、情報を抽出してください。
    出力例のJSONフォーマットに厳密に従い、各項目の値には指示された内容を記述してください。
    テキスト中に該当する情報が存在しない場合は、推測せずにその項目に null を設定してください。
    顧客が明確に発言していない内容を推測して記述することは絶対に避けてください。
    
    **重要：以下のJSON形式のみで出力してください。マークダウンやコメントは一切含めないでください。**
    
    出力例：
    {{
      "関係構築とヒアリング": {{
        "会議の参加者": "[会議に参加している人物の氏名、会社名、役職を特定し、配列で記述]",
        "顧客のプロフィール": "[顧客の会社名、事業内容、業界、企業規模など、顧客の基本情報を記述]",
        "現状の顧客の課題、ニーズ、目標": "[顧客が「困っている」「問題だ」「改善したい」「目指している」と明確に発言した内容を具体的に要約]",
        "今行っている取り組みやその成果・課題": "[顧客が課題解決のために「現在行っている施策」と、それに対する「成果」や「新たな問題点」を記述]",
        "過去に行なってきた取り組みやその結果": "[顧客が「過去に試した施策」と、その「結果」や「中止した理由」を記述]",
        "KPIや最終的なゴール": "[顧客が言及した具体的な数値目標（KPI）や、事業として達成したい最終的なゴールを記述]",
        "次回のスケジュール": "[次回の会議や電話などの具体的な「日時」「目的」「参加者」が設定されていれば記述]"
      }},
      "課題解決の提案とデモンストレーション": {{
        "BANT情報": {{
            "Budget": "[予算に関する顧客の発言を記述]",
            "Authority": "[決裁権に関する顧客の発言を記述]",
            "Need": "[必要性に関する顧客の発言を記述]",
            "Timing": "[導入時期に関する顧客の発言を記述]"
        }},
        "商材の紹介に対しての反応": "[提案したサービスや製品に対する顧客のポジティブな反応とネガティブな反応を分けて記述]",
        "商材を導入する際、顧客が懸念すること": "[導入プロセス、価格、機能、サポート体制など、顧客が導入にあたって「不安だ」「心配だ」と発言した懸念点をリストアップ]",
        "次回のスケジュール": "[次回の会議や電話などの具体的な「日時」「目的」「参加者」が設定されていれば記述]"
      }},
      "商談詳細の詰めと見積もりの提示": {{
        "価格": "[提示された具体的な金額、料金体系（月額、年額、買い切りなど）、支払い条件を記述]",
        "次回のスケジュール": "[次回の会議や電話などの具体的な「日時」「目的」「参加者」が設定されていれば記述]"
      }},
      "クロージング（契約締結）": {{
        "最終的契約内容の確認": "[契約期間、提供範囲、金額など、契約締結にあたって最終確認された条件を記述]"
      }},
      "このミーティングの後やるべきこと": "[会議後、自社（提案側）と顧客側でそれぞれ発生するタスク（TODO）を配列で記述]"
    }}
    
    文字起こしテキスト：
    {transcript}
    `;

    const prompt = PromptTemplate.fromTemplate(salesPrompt);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const result = await chain.invoke({ transcript: transcriptText });
    
    try {
        // マークダウンのコードブロックを除去
        const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanedResult);
    } catch (error) {
        console.error("JSON解析エラー:", error);
        return { error: "JSON解析に失敗しました", raw_response: result };
    }
}

/**
 * その他のミーティングの場合の情報抽出
 * @param {string} transcriptText - 文字起こしテキスト
 * @returns {Promise<Object>} - 抽出された情報のJSONオブジェクト
 */
async function extractGeneralMeetingInfo(transcriptText) {
    const model = new ChatOpenAI({
        modelName: process.env.OPENAI_MODEL || "gpt-4o-mini"
    });

    const generalPrompt = `
以下のミーティングの文字起こしテキストから、指定された情報を抽出してください。
情報が明記されていない場合は、該当する項目に null を設定してください。

抽出する情報：
- 会議の論点
- 結論
- 次やるTodo

**重要：JSON形式のみで出力してください。マークダウンやコメントは一切含めないでください。**

出力例：
{{
  "会議の論点": ["ユーザー認証機能の完成時期", "バグの優先度と修正スケジュール", "リリース予定日への影響"],
  "結論": "バグ修正を優先し、リリースを1週間延期する",
  "次やるTodo": ["田中：ユーザー認証機能の完成", "鈴木：バグレポート作成", "山田：スケジュール再調整"]
}}

文字起こしテキスト：
{transcript}
`;

    const prompt = PromptTemplate.fromTemplate(generalPrompt);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const result = await chain.invoke({ transcript: transcriptText });
    
    try {
        // マークダウンのコードブロックを除去
        const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanedResult);
    } catch (error) {
        console.error("JSON解析エラー:", error);
        return { error: "JSON解析に失敗しました", raw_response: result };
    }
}

/**
 * メイン関数：文字起こしを分析して適切な情報を抽出
 * @param {string} transcriptText - 文字起こしテキスト
 * @returns {Promise<Object>} - 分析結果
 */
async function generateMeetingSummary(transcriptText) {
    try {
        console.log("会議の種類を判定中...");
        const meetingType = await classifyMeetingType(transcriptText);
        console.log(`判定結果: ${meetingType}`);

        let extractedInfo;
        
        if (meetingType.includes("商談")) {
            console.log("商談情報を抽出中...");
            extractedInfo = await extractSalesInfo(transcriptText);
        } else {
            console.log("一般的なミーティング情報を抽出中...");
            extractedInfo = await extractGeneralMeetingInfo(transcriptText);
        }

        return {
            meetingType: meetingType,
            extractedInfo: extractedInfo,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error("エラーが発生しました:", error);
        return {
            error: "処理中にエラーが発生しました",
            details: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * メイン関数：ファイルから文字起こしテキストを読み込んで処理
 */
async function main() {
    // コマンドライン引数を取得
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log("使用方法: node generate_summarization.js <ファイルパス>");
        console.log("\n例:");
        console.log('node generate_summarization.js transcript.txt');
        console.log('node generate_summarization.js sample_sales.txt');
        console.log('node generate_summarization.js sample_meeting.txt');
        process.exit(1);
    }

    const filePath = args[0];
    let transcriptText = "";

    // ファイルから文字起こしを読み込み
    try {
        const fs = await import('fs/promises');
        transcriptText = await fs.readFile(filePath, 'utf-8');
        console.log(`ファイル "${filePath}" から文字起こしを読み込みました`);
    } catch (error) {
        console.error(`ファイル読み込みエラー: ${error.message}`);
        process.exit(1);
    }

    if (!transcriptText.trim()) {
        console.error("エラー: 文字起こしテキストが空です");
        process.exit(1);
    }

    // .envファイルの内容を表示
    logEnvFile();
    
    console.log("文字起こし分析を開始します...");
    console.log("=".repeat(50));

    try {
        const result = await generateMeetingSummary(transcriptText);
        
        console.log("\n" + "=".repeat(50));
        console.log("分析結果:");
        console.log("=".repeat(50));
        console.log(JSON.stringify(result, null, 2));
        
        // 結果をファイルに保存するオプション
        if (process.env.SAVE_RESULT === "true") {
            const fs = await import('fs/promises');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `analysis_result_${timestamp}.json`;
            await fs.writeFile(filename, JSON.stringify(result, null, 2));
            console.log(`\n結果を ${filename} に保存しました`);
        }

    } catch (error) {
        console.error("\n" + "=".repeat(50));
        console.error("エラーが発生しました:");
        console.error("=".repeat(50));
        console.error(error.message);
        console.error("\nスタックトレース:");
        console.error(error.stack);
        process.exit(1);
    }
}

// スクリプトが直接実行された場合のみmain関数を実行
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { generateMeetingSummary, main, logEnvFile };