# React + Kuromoji.js で形態素解析

クライアントサイドで形態素解析するブラウザアプリです。

形態素解析器は [kuromoji.js](https://github.com/takuyaa/kuromoji.js)、辞書は [IPADic](https://github.com/taku910/mecab/tree/master/mecab-ipadic)、[UniDic](https://clrd.ninjal.ac.jp/unidic/back_number.html#unidic_cwj)、[SudachiDict](https://github.com/WorksApplications/SudachiDict) を利用しています。

![ブラウザアプリのスクショ、SudachiDictが選択され、「形態/素/解析/でき/た/ぞ〜（ケイタイ/ソ/カイセキ/デキ/タ/ゾ）」という解析結果が表示されている](./docs/fig/screenshot_success_sudachidict.png)

## 履歴

### 2024/04/16
- トークナイザ読み込みの前に、UIで辞書を選択するようにしました
- SudachiDict をコピーするスクリプト [`copy_sudachidict.sh`](./copy_sudachidict.sh) を追加
- Qiita で記事を公開します：[kuromoji.js + SudachiDict で形態素解析（辞書のビルド、IPADic・UniDic との比較） - Qiita]()

### 2024/03/09
- トークナイザのロードにかかる時間をコンソールログに表示
- UniDic をコピーするスクリプト [`copy_unidic.sh`](./copy_unidic.sh) を追加
- Qiita で記事を公開しました：[kuromoji.js + UniDic で形態素解析（辞書のビルド） - Qiita](https://qiita.com/piijey/items/f95a0527208fdd2557bc) 

### 2024/01/17
- 少し速くなりました (refactor: Initialize kuromoji tokenizer only once at app mount)

### 2024/01/11
- Qiita で記事を公開しました：[React + Kuromoji.js で形態素解析（Webpackの設定と辞書ファイルの配置） - Qiita](https://qiita.com/piijey/items/a7ff20da2f7d7315abb0)
