const cheerio = require('cheerio');
const fs = require('fs');
const indexFilePath = 'dist/gnatquilt/index.html';

console.log('After build script started...');

// read our index file
console.log('About to rewrite file: ', indexFilePath);
fs.readFile(indexFilePath, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }

  // load html into cheerio so we can manipulate DOM
  const $ = cheerio.load(data);

  // Angular now inserts a type="module" attribute in script tags. As we want to get a static index.html,
  // we remove this attribute. Otherwise, the browser will emit cross-origin request to get the script, which
  // violates the same origin policy in the browser (and prevents us from loading the script without launching
  // a server).
  $('html').find('script').removeAttr('type');

  fs.writeFile(indexFilePath, $.html(), function (err) {
    if (err) return console.log(err);
    console.log('Successfully rewrote index html');
  });
});
