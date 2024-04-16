#!/bin/sh
# SudachiDict をビルドするためにデータをコピーする
DIR_TARGET="node_modules/mecab-ipadic-seed/lib/dict"
DIR_SOURCE="../../sudachi-dict-20240109"

mv "$DIR_TARGET" "$DIR_TARGET"-unidic
mkdir -p "$DIR_TARGET"
cp "${DIR_SOURCE}"/{matrix.def,char.def,unk.def} "$DIR_TARGET"/

awk -F',' 'OFS="," {print $1,$2,$3,$4,$6,$7,$8,$9,$10,$11,$13,$12,"*"}' "${DIR_SOURCE}/small_lex.csv" > "${DIR_TARGET}/small_lex-mod.csv"
