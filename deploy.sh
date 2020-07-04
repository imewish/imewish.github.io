#!/bin/bash

git stash
git pull
cd build
hugo
cp public/* ../
cd ..
git add *
git commit -m "update content"
git push