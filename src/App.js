import React, { useState, useEffect } from 'react';
import './App.css';
var kuromoji = require("kuromoji");

function App() {
  const [userInputText, setUserInputText] = useState("");
  const [tokens, setTokens] = useState([]);
  const [tokenizer, setTokenizer] = useState(null);

  useEffect(() => { //アプリのマウント時にkuromojiトークナイザを初期化
    kuromoji.builder({ dicPath: "/kuromoji-dict/" }).build(function (err, buildTokenizer) { //dicPathで辞書のディレクトリを指定
      if (err) {
        console.log(err);
      } else {
        setTokenizer(buildTokenizer);
      }
    });
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
        <form onSubmit={analyze}>
          <input name="text" type="text" placeholder="テキストを入力します"/>
          <button type="submit" className="btn btn-primary">Analyze</button>
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
