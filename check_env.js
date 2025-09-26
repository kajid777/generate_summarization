import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config();

/**
 * メイン関数：環境変数の内容を表示
 */
function main() {
    console.log(`OPENAI_API_KEY=${process.env.OPENAI_API_KEY || '未設定'}`);
    console.log(`OPENAI_MODEL=${process.env.OPENAI_MODEL || '未設定'}`);
    console.log(`SAVE_RESULT=${process.env.SAVE_RESULT || '未設定'}`);
}

// スクリプトが直接実行された場合のみmain関数を実行
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main };
