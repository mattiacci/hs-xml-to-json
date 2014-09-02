#!/usr/bin/env node
// -*- js -*-

var fs = require('fs'),
    path = require('path'),
    xml2js = require('xml2js');


// Constants
var BAD_PREFIXES = [
  "CRED_",
  "GAME_",
  "HERO_",
  "PlaceholderCard",
  "PRO_",
  "XXX_"
];


// Utilities

function checkArgs() {
  try {
    var args = {};
    if (!process.argv[2]) {
      throw 'No directory specified.';
    }
    args.cardDir = fs.realpathSync(process.argv[2]);
    if (!fs.statSync(args.cardDir).isDirectory()) {
      throw process.argv[2] + 'is not a directory.';
    }
    if (process.argv[3]) {
      args.outputFile = fs.openSync(process.argv[3], 'w', '0644');
    }
  } catch (e) {
    printHelp();
    process.exit(1);
  }
  return args;
}

function printHelp() {
  var scriptName =
      process.argv[1].replace(/.*[\\\/]/, '').replace(/\.[^.]+$/, '');
  var msg = "Usage: " + scriptName + " DIR [OUTFILE]\n\n" +
      "Read XML card data in DIR and output to standard output," +
      "or optionally OUTFILE.";
  console.log(msg);
}

function trimRight(str) {
  return str.replace(/\s+$/, '');
}

function formatCard(card) {
  var formattedCard = {};
  var tags = card.Entity.Tag.forEach(function(tag) {
    formattedCard[tag.$.name] = tag.$.value || tag.enUS[0];
  });
  return formattedCard;
}


// Main Code

// Get card XML directory and output filename.
var args = checkArgs();

// Read in card XML data and bad prefix data.
var filenames = fs.readdirSync(args.cardDir);

// Filter out filenames which match bad prefixes.
filenames = filenames.filter(function(filename) {
  return BAD_PREFIXES.every(function(prefix) {
    return prefix != filename.slice(0, prefix.length);
  });
});

// Read in and format each card file, saving the results as an array.
var output = [];
filenames.forEach(function(filename) {
  var xml = fs.readFileSync(path.join(args.cardDir, filename));
  new xml2js.Parser({async:false}).parseString(xml, function(err, card) {
    if (err) {
      console.log(err);
    } else {
      output.push(formatCard(card));
    }
  });
});

// Write out the formatted cards data.
var output = JSON.stringify(output);
if (args.outputFile) {
  fs.writeSync(args.outputFile, output + '\n');
  fs.close(args.outputFile);
} else {
  console.log(output);
}
