# kuromoji.js + SudachiDict で形態素解析（辞書のビルド、IPADic・UniDic との比較）
2024/04/16

**[kuromoji.js](https://github.com/takuyaa/kuromoji.js)** （日本語形態素解析器 Kuromoji の JavaScript実装）と React を組み合わせて、クライアントサイドで完結するブラウザアプリを開発しています。kuromoji.js は [IPADic \(mecab-ipadic-20070801\)](https://github.com/taku910/mecab/tree/master/mecab-ipadic) をデフォルト辞書として使用していますが、収録語彙が私のアプリケーションの目的には最適ではないと感じていました。また、[UniDic](https://clrd.ninjal.ac.jp/unidic/back_number.html#unidic_cwj) は機能面で魅力的ですが、[ビルドして使ってみた結果](https://qiita.com/piijey/items/f95a0527208fdd2557bc)、データサイズが大きすぎてスマートフォンでは動作しないという課題に直面しました。

そこで今回は、 **SudachiDict**（[WorksApplications/SudachiDict: A lexicon for Sudachi](https://github.com/WorksApplications/SudachiDict)）の可能性に注目しました。この辞書は語彙が豊富で更新頻度が高く、本来は Java や Python の形態素解析器 Sudachi 向けに作られていますが、ソースファイルが公開されているので、 **kuromoji.js でビルドして利用する**ことが可能です。

この記事では、まず、 SudachiDict を kuromoji.js 用にビルドする手順を紹介します。それから、形態素解析をクライアントサイドで行うアプリケーションを想定し、SudachiDict と IPADic、UniDic を比較します。各辞書の語彙数と kuromoji.js トークナイザーのロードにかかる時間を考慮すると、SudachiDict は有力な選択肢になりそうです。


## 1. 準備
### 1.1. Node.js のインストール、kuromoji.js のセットアップ

kuromoji.js を npm 経由か [kuromoji.js の GitHubリポジトリ](https://github.com/takuyaa/kuromoji.js) からダウンロードし、インストールします。kuromoji.js で形態素解析するためのサンプルコードは、GitHubリポジトリの README にあります。

kuromoji.js のトークナイザは、形態素解析に利用する際、 Node.js の新しいバージョン（v20 など）で正常に動作しますが、辞書ビルダは Node.js の古いバージョンでないと動かないので、別途 Node.js の古いバージョンをインストールしておきます。

```sh
node -v
# v10.16.3
```

kuromoji.js で辞書をビルドするための基本的な準備については、以前の記事「[kuromoji.js + UniDic で形態素解析（辞書のビルド）](https://qiita.com/piijey/items/f95a0527208fdd2557bc)」もご参照ください。


### 1.2. SudachiDict のダウンロード
SudachiDict をビルドするために、 `*_lex.csv`、`matrix.def`、`char.def`、`unk.def` の4種類のソースファイルが必要です。これらのファイルを格納するディレクトリとして、作業ディレクトリかどこかに `sudachi-dict-20240109/` を作成します。

**`*_lex.csv` と `matrix.def`** は、[SudachiDict の GitHub リポジトリ](https://github.com/WorksApplications/SudachiDict) で README の下のほうにある "Build from sources" のリンク（現時点では、AWS [Sudachi Dictionary Sources \(CSV\)](http://sudachi.s3-website-ap-northeast-1.amazonaws.com/sudachidict-raw/) ）からダウンロードして展開します。

※ 以下では `small_lex.zip` を展開した `small_lex.csv` を使用しますが、他のバージョンを使用する際は適宜読み替えてください。

**`char.def` と `unk.def`** は、[Sudachi の GitHub リポジトリ](https://github.com/WorksApplications/Sudachi) の [`src/main/resources/`](https://github.com/WorksApplications/Sudachi/tree/develop/src/main/resources) からダウンロードします。


### 1.3. ディレクトリとファイルの構成
作業ディレクトリ（プロジェクトのルートディレクトリ）以下のディレクトリとファイルの構成は、下記の図のようになります。

```sh
project
├── sudachi-dict-20240109/ # [1.2] でダウンロードした辞書ソースファイルを保管するディレクトリ
│   ├── small_lex.csv
│   ├── matrix.def
│   ├── char.def
│   └── unk.def
├── node_modules/
│   ├── kuromoji/
│   │   ├── node_modules/
│   │   │   ├── mecab-ipadic-seed/
│   │   │   │   ├── lib/
│   │   │   │   │   ├── dict/ # [2] でビルドに使用する辞書ソースファイルをここにコピーする
│   │   │   │   │   │   ├── small_lex-mod.csv # カラムを並べ替えてフォーマットを合わせる
│   │   │   │   │   │   ├── matrix.def
│   │   │   │   │   │   ├── char.def
│   │   │   │   │   │   └── unk.def
│   │   │   │   │   └── ...
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── dict/ # [3] でビルド後の辞書はここに自動的に格納される
│   │   │   ├── base.dat.gz
│   │   │   ├── cc.dat.gz
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── public/
│   ├── kuromoji-dict-sudachi/ # [4] でブラウザアプリが参照できるディレクトリにビルド済み辞書を配置する
│   │   ├── base.dat.gz
│   │   ├── cc.dat.gz
│   │   └── ...
│   └── ...
└── ...
```


## 2. SudachiDict のソースを辞書ビルダが参照するディレクトリに配置

kuromoji.js の辞書ビルダは、元の辞書を読み込むために `mecab-ipadic-seed` モジュールを使用しています。このモジュールが参照するソース辞書ディレクトリに、1 でダウンロードした辞書を配置します。

ここからは、kuromoji.js のルートディレクトリに移動して作業します。

```sh
cd node_modules/kuromoji/
```

`mecab-ipadic-seed` モジュールが参照するソース辞書ディレクトリには、デフォルトでは IPADic が入っているので、退避しておきます。

```sh
mv node_modules/mecab-ipadic-seed/lib/dict node_modules/mecab-ipadic-seed/lib/dict-ipadic
mkdir node_modules/mecab-ipadic-seed/lib/dict
```

さきほどダウンロードした SudachiDict の `../../sudachi-dict-20240109/*.def` を、`mecab-ipadic-seed` のソース辞書ディレクトリにコピーします。

```sh
cp ../../sudachi-dict-20240109/{matrix.def,char.def,unk.def} node_modules/mecab-ipadic-seed/lib/dict/
```

SudachiDict のCSVファイル (`*_lex.csv`) は、カラムの並び順を IPADic に合わせてコピーします。

```sh
awk -F',' 'OFS="," {print $1,$2,$3,$4,$6,$7,$8,$9,$10,$11,$13,$12,"*"}' ../../sudachi-dict-20240109/small_lex.csv > node_modules/mecab-ipadic-seed/lib/dict/small_lex-mod.csv
```


### `*_lex.csv` のカラムの並べ替えについて

SudachiDict の `*_lex.csv` は、 IPADic の `*.csv` とはフォーマットが微妙に異なるので、対応する部分を抜き出して並べ替えました（上述の awk の部分）。

IPADic のフォーマット（kuromoji.js がビルド時・実行時に読む列）は、kuromoji.js のソースコードの2つの箇所で指定されています。

- `kuromoji/src/dict/TokenInfoDictionary.js`
- `kuromoji/src/util/IpadicFormatter.js`

SudachiDict のフォーマットについては、[**Sudachi ユーザー辞書作成方法** - Sudachi/docs/user_dict.md](https://github.com/WorksApplications/Sudachi/blob/develop/docs/user_dict.md) のページを参照しました。

これらの情報を整理し、下記のように対応づけました。SudachiDict には発音が記載されていないので、`*` で埋めています。

|IPADic|kuromoji.js|SudachiDict| SudachiDict |
|--:|:--|--:|:--|
| 0|surface_form | 0|見出し|
| 1|left_id      | 1|左連接ID|
| 2|right_id     | 2|右連接ID|
| 3|word_cost    | 3|コスト|
| 4|pos          | 5|品詞1|
| 5|pos_detail_1 | 6|品詞2|
| 6|pos_detail_2 | 7|品詞3|
| 7|pos_detail_3 | 8|品詞4|
| 8|conjugated_type|9|品詞(活用型)|
| 9|conjugated_form|10|品詞(活用形)|
|10|basic_form   |12|正規化表記|
|11|reading      |11|読み|
|12|pronunciation|なし|*|

※ awk のインデックスは 1 始まり


## 3. SudachiDict を kuromoji.js でビルド

辞書を kuromoji.js でビルドします。

```sh
npm run build-dict
```

ビルドがうまくいけば、`dict/` 下に `*.dat.gz` ファイルが生成されます。

ビルドがうまくいかない場合、「[kuromoji.js + UniDic で形態素解析（辞書のビルド）](https://qiita.com/piijey/items/f95a0527208fdd2557bc)」も参考にしてみてください。


## 4. ブラウザアプリでの利用

ビルドされた SudachiDict を、アプリケーションが参照できる位置にコピーします。

```sh
cp -r dict ../../public/kuromoji-dict-sudachi
```

React で kuromoji.js を利用する際のセットアップについては、以前の記事「[React + Kuromoji.js で形態素解析（Webpackの設定と辞書ファイルの配置）](https://qiita.com/piijey/items/a7ff20da2f7d7315abb0)」をご参照ください。

アプリケーション側で、トークナイザに渡す辞書のパスを、SudachiDict に変更します。

```js
// App.js
kuromoji.builder({ dicPath: process.env.PUBLIC_URL + "/kuromoji-dict-sudachi/" }).build(function (err, tokenizer) { //...
```


## 5. 辞書のサイズとトークナイザのロード時間の比較

最後に、3種類の辞書の語彙数、ソース辞書ファイルサイズ、ビルド済み辞書のファイルサイズ、トークナイザのロードに要する時間を比較します。

**使用した辞書**

- [IPADic (mecab-ipadic-20070801)](https://github.com/taku910/mecab/tree/master/mecab-ipadic)
- [SudachiDict (20240109 small_lex)](https://github.com/WorksApplications/SudachiDict)
- [UniDic (unidic-cwj-202302)](https://clrd.ninjal.ac.jp/unidic/back_number.html#unidic_cwj)

**トークナイザのロードにかかる時間**  
[React と kuromoji.js で作成したブラウザアプリ](https://github.com/piijey/kuromoji.js-react-app)でざっくり測定しました。前セクションの react-app-rewired で起動した開発用ローカルサーバーを使用します。

- PC: M1 iMac + Chrome、 localhost を通じてアクセス
- スマートフォン: iPhone 12mini + Safari、同一ネットワーク上の無線LANを通じてアクセス

このネットワーク条件は比較的安定しており、異なる辞書のサイズによるトークナイザのロード時間を比較するには十分ですが、本番環境ではロード時間が異なる可能性があります。

一度トークナイザがロードされてしまえば、形態素解析の実行速度は十分速く、3つの辞書の差は特に感じていません。

**辞書のサイズとトークナイザのロード時間の比較**

| 辞書 | 語彙数<br>(csvファイルの行数) | matrix.def<br>size | ビルド後<br>*.dat.gz size 合計 | tokenizer<br>ロード時間<br>PC | tokenizer<br>ロード時間<br>スマホ |
|:--|--:|--:|--:|--:|--:|
| **IPADic** | 392,126 | 22M | 17M | 0.8 秒 | 10 秒 |
| **SudachiDict** | 765,613 | 491M | 49M | 1.9 秒 | 30 秒|
| **UniDic** | 876,803 | 59G | 480M | 13 秒 | エラー |

**語彙数とファイルサイズ**  
語彙数の増加に伴い、特に接続コストファイル (matrix.def) のサイズが大きく増加します。 SudachiDict と UniDic は語彙数が近いにも関わらず、接続コストファイルのサイズに桁違いの差があります。

**UniDic のロードエラー**  
UniDic をスマートフォンでロードしようとすると、 `XMLHttpRequestProgressEvent` によるエラーが発生しました。ファイルサイズが大きすぎて、リソースの限られたモバイルデバイスでの処理が困難であるためと考えられます。

**実用性とパフォーマンスの考慮**  
IPADic の収録語彙は、文学的な表現が手厚い一方で、日常的に使う語彙（「リコーダー」や「鬱」など）がやや不足しており、私のアプリケーションの目的にあまり合っていないと感じていました。その辺りは SudachiDict のほうがよく、さらに、 UniDic で発生したスマートフォンで動作しない問題も、今のところ発生していません。トークナイザのロード時間がどれだけ許容されるかはアプリケーションの要件によって異なりますが、SudachiDict は有力な選択肢になると考えています。
