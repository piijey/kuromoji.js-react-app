import React, { useState, useEffect } from 'react';
import './App.css';
var kuromoji = require("kuromoji");

function App() {
  const [ loading, setLoading ] = useState(true);
  const [ message, setMessage ] = useState('辞書を選択してください');

  const dictionaries = [
    { dir: "kuromoji-dict", label: "IPA辞書" },
    { dir: "kuromoji-dict-unidic", label: "UniDic" },
    { dir: "kuromoji-dict-sudachi", label: "SudachiDict" },
  ];
  const [dictionaryDir, setDictionaryDir] = useState(null);

  function DictionarySelector() {
    const [selected, setSelected] = useState(dictionaryDir || dictionaries[0].dir);
    function changeValue(e) { // ラジオボタンのクリックを画面に反映する
      setSelected(e.target.value);
    };

    function handleSubmit() { // クリックされたら kuromoji.js に渡す辞書を変更し、ロード中にする
      setDictionaryDir(selected);
      setLoading(true);
      setMessage(`トークナイザを読み込み中 ... ${selected}`)
      console.log("選択された辞書:", selected);
    }
  
    const dictOptions = dictionaries.map((dict, index) =>
      <div className="form-check" key={index}>
        <input
         className="form-check-input"
         type="radio"
         id={`dict-${index}`}
         name="dictionary"
         value={dict.dir}
         checked={dict.dir === selected}
         onChange={changeValue}
        />
        <label className="form-check-label" htmlFor={`dict-${index}`}> {/* htmlFor属性を使ってラベルを関連付けることで、ラベルをクリックしてもチェックラジオに反映される */}
          {dict.label}
        </label>
      </div>
    );
    return (
      <div className='container dictionary-options'>
        <div className="form-check d-flex row">
          <div className='col-5'>
            { dictOptions }
          </div>
          <div className='col-7'>
            <button onClick={handleSubmit} className={`btn ${dictionaryDir ? 'btn-secondary' : 'btn-primary'}`}>
              { dictionaryDir ? '変更' : '決定' }
            </button>
            <p>{ message }</p>
          </div>
          <div className='col'/>
        </div>
      </div>
    );
  }
  
  const [userInputText, setUserInputText] = useState("");
  const [tokens, setTokens] = useState([]);
  const [tokenizer, setTokenizer] = useState(null);

  useEffect(() => { // handleSubmit によって辞書が選択されたら、kuromojiトークナイザを初期化
    if ( !dictionaryDir ) {return}
    setTokens([]);
    setUserInputText('');

    function initializeTokenizer() {
      return new Promise((resolve, reject) => {
        kuromoji.builder(
          { dicPath: process.env.PUBLIC_URL + dictionaryDir }
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
        const initializedTokenizer = await initializeTokenizer();
        setTokenizer(initializedTokenizer);
        setLoading(false);
        const endTime = performance.now();
        setMessage(`トークナイザのロードにかかった時間: ${(endTime - startTime).toFixed(2)} ms`);
        console.log(`トークナイザのロードにかかった時間: ${(endTime - startTime).toFixed(2)} ms`);
      } catch (err) {
        console.log(err)
        if (err instanceof ProgressEvent) {
          setMessage(`トークナイザが読み込めなかったよ、ぴぇっ。ほかの小さな辞書にしてみてね！ ${err}`);
        } else if (err.message) {
          setMessage(`トークナイザのロードに失敗しました: ${err.message || err}`);
        };
      };
    };

    loadTokenizer();
  // eslint-disable-next-line
  }, [dictionaryDir]);

  function analyze(event) {
    event.preventDefault();  // デフォルトのフォーム送信を阻止
    if (!tokenizer) {
      setMessage("トークナイザが利用できません");
      return
    }
    setMessage('');

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
        <h1> Try kuromoji.js </h1>
        <DictionarySelector/>
        { loading ? <>
        {}
        </> : <>
        <div className='box-input-text'>
        <form onSubmit={analyze}>
          <div className='input-group'>
            <input name="text" type="text" className="form-control" placeholder="テキストを入力"/>
            <button type="submit" disabled={loading} className="btn btn-primary">解析</button>
          </div>
        </form>
        <div className='text-show'>{userInputText}</div>
        </div>
        <div className='box-show-result'>
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
        </> }
      </div>
    </div>
  );
}

export default App;
