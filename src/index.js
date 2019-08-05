var promisify = require('util').promisify;
var fs = require('fs');
var path = require('path')
var conversor = require('./conversor')

var sourcePath = path.resolve(__dirname, '../sources')
var readFile = promisify(fs.readFile);
var readdir = promisify(fs.readdir);

async function run () {
    var sources = await readdir(sourcePath)
    
    for(let i = 0;i < sources.length;i ++){
        let file = await readFile(path.resolve(sourcePath, sources[i]))
        conversor(file)
    }
}

run()