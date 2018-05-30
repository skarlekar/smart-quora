const fs = require('fs')
if (process.argv.length <5) {
  console.log("Usage: " + process.argv[0] + " " + process.argv[1] + " <file> <search-string> <replace-string>");
  process.exit(1);
}

fs.readFile(process.argv[2], 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var re = new RegExp(process.argv[3], "g");
  var result = data.replace(re, process.argv[4]);

  fs.writeFile(process.argv[2], result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});
