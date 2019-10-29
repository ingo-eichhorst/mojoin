#! /usr/bin/env node

/*
 *  << Description >>
 */

const program = require("commander");
const fs = require("fs");
const path = require("path");
const packet = JSON.parse(
  fs.readFileSync(path.join(__dirname, "/../package.json"), "utf8")
);

const { formatData } = require("./utils.js");
const { joinMongoCollections } = require("./join.js");

program
  .version(packet.version)
  .description(packet.description)
  .option(
    "-q, --query [query]",
    "join query or path to (json, or yml) file that contains the query"
  )
  .option("-f, --file [filepath]", "output file (xls, csv, json)")
  .option(
    "-k, --key [file]",
    "absolute path to private ssh key (only for ssh auth)"
  )
  .parse(process.argv);

// Input validaton
if (!program.query)
  throw console.error(
    "no query specified. always specify query as (json or yaml) file pointer or json string"
  );

joinMongoCollections(program, (err, result) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  // determine the output file format from file ending (defaults to json)
  let format;
  if (program.file && program.file.includes("."))
    format = program.file.split(".").slice(-1)[0];
  let resultString = formatData(result, format);

  // set the encoding for excel differently
  let encoding = "utf8";
  if (format === "xls") encoding = "binary";

  if (program.file) {
    fs.writeFile(program.file, resultString, encoding, function(error) {
      if (error) return console.error("write error:  " + error.message);
      console.log("Create report at " + program.file);
      process.exit(0);
    });
  } else {
    console.log(resultString);
    process.exit(0);
  }
});

module.exports = joinMongoCollections;
