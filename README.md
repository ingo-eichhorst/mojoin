# !!! DEVELOPMENT STAGE - DO NOT USE YET !!

# Mongo Database Join

<LOGO>

Mojoin is a tool to join multiple collections from multiple MongoDB databases. 

#### What is that good for?
If you have one MongoDB containing multiple collection you can use the lookup to join collections that was released with version 3.4:
https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/ 
But if you have seperate MongoDB databases which is often the case in micro service or serverless world e.g. on seperate hosts you cannot use any MongoDB tooling to make joins. Besides often expensive and havy weight business inteligence systems there is less tooling availiable to help joining MongoDB databases.

#### Why Mojoin?

- Lightwight and easy to get started
- Simple querying language
- Connect via SSH and directly over the mongodb protocol

## Getting Started

### Prerequisites

- node.js >= 6.0.0
- mogodb >= 3.0.0

### UI
<in development>

### CLI
On the command line its highly reccomented to write the query in a JSON or even better YAML template file instead of typing it by hand in the commandline.



Using a key file
`mojoin -k /full/path/to/.ssh/keyfile -q templates/query.yml -f output/result.csv`



### Library

### REST

## Features

## Install / Dependencies

## Usage

### CLI

### Library

### REST API

### UI

## Contribute

1. clone master and checkout new branch --> e.g. fix/spacing
2. Make changes/ fixes
3. Run `npm test` to check that nothing broke
4. Run `npm lint` and fix potential style issues
5. create pull request to master