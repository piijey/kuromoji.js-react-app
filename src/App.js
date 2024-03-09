import React, { useState, useEffect } from 'react';
import './App.css';
var kuromoji = require("kuromoji");

function App() {
  const [userInputText, setUserInputText] = useState("");
  const [tokens, setTokens] = useState([]);
  const [tokenizer, setTokenizer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { //アプリのマウント時にkuromojiトークナイザを初期化
    function initializeTokenizer() {
      return new Promise((resolve, reject) => {
        kuromoji.builder(
          //{ dicPath: process.env.PUBLIC_URL + "/kuromoji-dict/" } //IPADic
          { dicPath: process.env.PUBLIC_URL + "/kuromoji-dict/" } //UniDic
          ).build((err, buildTokenizer) => {
          if (err) {
              reject(err);
          } else {
              resolve(buildTokenizer);
          }
        });
      });
    };

    async function loadTokenizer() {
      const startTime = performance.now();
      console.log("トークナイザをロードしています...");
      try {
          const tokenizer = await initializeTokenizer();
          setTokenizer(tokenizer);
          console.log("トークナイザををロードしました");
      } catch (err) {
          console.error("トークナイザのロードに失敗しました", err);
      } finally {
          setLoading(false);
          const endTime = performance.now();
          console.log(`トークナイザのロードにかかった時間: ${(endTime - startTime).toFixed(2)} ms`);
      }
    };

    loadTokenizer();
  // eslint-disable-next-line
  }, []);

  function analyze(event) {
    event.preventDefault();  // デフォルトのフォーム送信を阻止
    if (!tokenizer) {
      console.error("トークナイザが利用できません");
      return
    }

    const formData = new FormData(event.target);
    const text = formData.get("text");
    setUserInputText(text); // 入力されたテキストをステートにセット

    // kuromojiを使ってテキストをトークナイズ
    const path = tokenizer.tokenize(text);
    setTokens(path); // トークナイズ結果をステートにセット
  }

  return (
    <div className='App'>
      <div className="card p-2 align-items-center">
        {loading ? <>辞書を読み込み中 ... </> : <></> }
        <form onSubmit={analyze}>
          <div className='input-group'>
            <input name="text" type="text" className="form-control" placeholder="テキストを入力"/>
            <button type="submit" disabled={loading} className="btn btn-primary">解析</button>
          </div>
        </form>
        <p>{userInputText}</p>
        {/* トークンの情報を表形式で表示 */}
        <table>
          <thead>
            <tr>
              <th>開始位置</th>
              <th>表層形</th>
              <th>品詞</th>
              <th>基本形</th>
              <th>読み</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token, index) => (
              <tr key={index}>
                <td>{token.word_position}</td>
                <td>{token.surface_form}</td>
                <td>{token.pos}</td>
                <td>{token.basic_form}</td>
                <td>{token.reading}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
