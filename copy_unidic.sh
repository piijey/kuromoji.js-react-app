#!/bin/sh
# UniDic をビルドするためにデータをコピーする
DIR_TARGET="node_modules/mecab-ipadic-seed/lib/dict"
DIR_SOURCE="../../unidic-cwj-202302_full"

mv "$DIR_TARGET" "$DIR_TARGET"-ipadic
mkdir -p "$DIR_TARGET"
cp "${DIR_SOURCE}"/{matrix.def,char.def,unk.def} "$DIR_TARGET"/

awk -F',' 'OFS="," {print $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$14,$25,$15}' "${DIR_SOURCE}/lex.csv" > "${DIR_TARGET}/lex-mod.csv"
