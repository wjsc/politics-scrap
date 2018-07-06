const fetch = require('node-fetch');
const fs = require('fs');
const separator = '~';
const createRowObject = require('./parser');

console.log('Node > v8.0.0 required');
console.log('------------------------');
let startIndex = 91800;
const maxResults = 1630;
const currentFile = new Date().toJSON()+'.csv';

const buildURL = index => {
  return 'http://directorio.directoriolegislativo.org/node/' + index;
}

const URLGenerator = function* (){
  for(i = startIndex; i < startIndex + maxResults; i++ ){
    yield { url: buildURL(i), index: i};
  }
}

const fetchHtml = url => {
  return fetch(url).then( res => res.text() );
}

const readCache = url => {
  return new Promise((resolve, reject)=>{
    fs.readFile(`./cache/${index}`, (err, html)=>{
      if (err) resolve(false);
      resolve(html);
    });
  })
}

const writeCache = (index, html) => {
  return new Promise((resolve, reject)=>{
    fs.writeFile(`./cache/${index}`, html, { flag: 'a' }, err=>{
      if (err) reject(err);
      resolve(html);
    });
  })
}

const getHTML = async (index, url) => {
  const cachedHtml = await readCache(index);
  if( cachedHtml ) {
    console.log(`${index} : Resolved from Cache`);
    return cachedHtml;
  }
  const fetchedHtml = await fetchHtml(url);
  console.log(`${index} : Resolved from Network`);
  await writeCache(index, fetchedHtml);
  return fetchedHtml;
}

const arrayPad = (rowObject, keysMaxLengths) =>{
  Object.keys(rowObject)
    .filter( key => Array.isArray(rowObject[key]))
    .forEach( key => {
      for(let i = rowObject[key].length; i < keysMaxLengths[key]; i++){
        rowObject[key].push('-');
      }
    })
  return rowObject;
}

const formatRow = (rowObject) => {
  return Object.keys(rowObject)
                .reduce( (prev, currentKey) => 
                  prev + 
                  (Array.isArray(rowObject[currentKey]) 
                    ? rowObject[currentKey].join(separator) 
                    : rowObject[currentKey])
                  + separator
                , "")
                .replace(new RegExp(`${separator + separator}`, 'g'), separator + '-' + separator) + '\n';
}

const writeRow = (row) => {
  return new Promise((resolve, reject)=>{
    fs.writeFile(currentFile, row, { flag: 'a' }, err=>{
      if (err) reject(err);
      resolve(row);
    });
  })
}

const writeOutput = async(rowObjects, keysMaxLengths) => {
  for (const rowObject of rowObjects){
    const row = await writeRow(formatRow(arrayPad(rowObject, keysMaxLengths)));
  }
}

async function run(){
  const rowObjects = [];
  const keysMaxLengths = [];
  for ({url, index} of URLGenerator()){
    const rowObject = createRowObject(await getHTML(index, url), url);
    if(rowObject) {
      Object.keys(rowObject).filter(k => Array.isArray(rowObject[k])).forEach( k => keysMaxLengths[k] = Math.max(rowObject[k].length, keysMaxLengths[k] || 0))
      rowObjects.push(rowObject);
    }
  }
  
  await writeOutput(rowObjects, keysMaxLengths);
}

run();
