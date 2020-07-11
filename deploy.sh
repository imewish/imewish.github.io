git pull
cd build && hugo && cd -
cp -r build/public/* .
git add .
git commit -m "update posts"
git push