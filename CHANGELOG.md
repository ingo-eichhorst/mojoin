# Roadmap

- refactor from callbacks to promises
- check code coverage
- badges in readme (code-coverage)
- can be hooked as module
- webserver API
- webserver UI (react || vue)
- pagination of queries to get only a limited amount of entries from database
- write to tmp to reduce memory needed
- Password secured ssh and mongodb
- create examples

- finish unit tests
- linting of the code
- automatically include join key fields in the mongo projection
- publish at gitHub
- readme with how-to
- improve the structure of the files in lib
- refactor templates - require directly + better - simpler query
- change ssh back to non-promise (ssh2 instead of node-ssh)
- contribution guide


# Version 0.0.5

- added options/noMatch in the join part of the query
- jobs and progress display for long running tasks
- experimental: options/binarySearch - much better performance due to better complexity class
- license file MIT
- publish at npm - can be required by `npm i -g mojoin`

# Version 0.0.2 - 0.0.4

- smaller bugfixings

# Version 0.0.1

- Simple join on 2 or more databases over CLI
- MongoDb access over mongodb protocol
- Connect to MongoDb via ssh (only if the mongodb is unsecured)
- Accept input as YML