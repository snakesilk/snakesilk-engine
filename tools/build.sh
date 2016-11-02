#! /usr/bin/env bash

set -e

MY_DIR="$(dirname $0)"
BUILD_DIR="$(dirname $0)/../build"

mkdir -p $BUILD_DIR

$MY_DIR/create-requirable-bundle.js > $BUILD_DIR/snakesilk.js
