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

  // Yet another hack: as we are generating a static html page, we can't load scripts through HTTP request. Highligh.js
  // relies on such a mechanism to load its scripts. To work around that, we will load the generated scripts
  // preemptively, so that they are not loaded later through HTTP requests.
  $('html').append('<script src=167.js></script>');
  $('html').append('<script src=343.js></script>');
  $('html').append('<script src=700.js></script>');

  fs.writeFile(indexFilePath, $.html(), function (err) {
    if (err) return console.log(err);
    console.log('Successfully rewrote index html');
  });
});
