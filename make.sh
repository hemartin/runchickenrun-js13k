rm -f runchickenrun-js13k.zip

echo "minifying..."
uglifyjs js/*.js -o rcr.js -c toplevel

echo "zipping..."
zip runchickenrun-js13k.zip index.html rcr.js fav.gif

echo "zip file:"
ls -lh runchickenrun-js13k.zip
