#! /usr/bin/env bash
set -e

DIST="./dist/"

if [ -d "$DIST" ]; then
    rm -r $DIST
fi

babel ./src --out-dir ./dist
