# Changelog

## Roadmap

- [ ] Seperate library from API code/ repository
- [ ] Rust for performance improvements

## 0.1

- [ ] redesign with classes/ OOP
- [ ] analyse periodically
- [ ] 100% code coverage
- [ ] webserver API
- [ ] webserver UI (react || vue)
- [ ] data output for 2D Diagrams/ Dashboards

## 0.0.8

- [ ] refactor from callbacks to promises
- [ ] badges in readme (code-coverage)
- [ ] can be hooked as module
- [ ] pagination of queries to get only a limited amount of entries from database
- [ ] write to tmp to reduce memory needed
- [ ] Password secured ssh and mongodb
- [ ] documentation: create examples

- [ ] finish unit tests
- [ ] publish at gitHub
- [ ] improve the structure of the files in lib
- [ ] refactor templates - require directly + better - simpler query
- [ ] change ssh back to non-promise (ssh2 instead of node-ssh)
- [ ] contribution guide
- [ ] handling of dates and times correctly
- [ ] correct handling of \_id

- [ ] adding support for querying REST API's and mongodb

- [ ] end the cli process with code 0 if successfull. else error and code
- [ ] readme with how-to
- [ ] Also support dates in the query: https://github.com/primus/ejson
- [ ] binary search suporting non distinct queries
- [ ] automatically include join key fields in the mongo projection

## Version 0.0.8 (28.10.2019)

- [x] Exit prgramm with exit code 0 (success) or 1 (error)

## Version 0.0.7 (05.03.2018)

- [x] bug fixes

## Version 0.0.6 (29.11.2017)

- [x] linting of the code
- [x] check code coverage
- [x] option to use distinct on a query

## Version 0.0.5

- [x] added options/noMatch in the join part of the query
- [x] jobs and progress display for long running tasks
- [x] experimental: options/binarySearch - much better performance due to better complexity class
- [x] license file MIT
- [x] publish at npm - can be required by `npm i -g mojoin`

## Version 0.0.2 - 0.0.4

- [x] smaller bugfixings

## Version 0.0.1

- [x] Simple join on 2 or more databases over CLI
- [x] MongoDb access over mongodb protocol
- [x] Connect to MongoDb via ssh (only if the mongodb is unsecured)
- [x] Accept input as YML
