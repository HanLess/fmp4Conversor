var promisify = require('util').promisify;
var fs = require('fs');
var path = require('path')
var conversor = require('./conversor')

var sourcePath = path.resolve(__dirname, '../sources')
var outputPath = path.resolve(__dirname, '../output')
var readFile = promisify(fs.readFile);
var readdir = promisify(fs.readdir);
var writeFile = promisify(fs.writeFile);

function toBuffer(ab) {
    var buf = Buffer.alloc(ab.byteLength);
    for (var i = 0; i < buf.length; ++i) {
        buf[i] = ab[i];
    }
    return buf;
}

async function run () {
    var sources = await readdir(sourcePath)
    console.log(sources)
    for(let i = 0;i < sources.length;i ++){
        let file = await readFile(path.resolve(sourcePath, sources[i]))
        console.log(file.length)
        let s = conversor(file);
        let buf = toBuffer(s);
        console.log(buf.length)

        let err = await writeFile(path.resolve(outputPath, 'c_' + sources[i]), buf);
        if (err) {
            console.error(err)
        }
    }
}

run()