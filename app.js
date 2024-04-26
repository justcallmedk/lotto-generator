const mysql = require('mysql');
const util = require('util');

let connection,query;

const DRAW_DATE_INDEX = 8;
const NUMBER_INDEX = 9;
const PB_PB_INDEX = 5;
const MM_MB_INDEX = 10;
const PB_TYPE = 1;
const MM_TYPE = 2;
const PB_URL = 'https://data.ny.gov/api/views/d6yy-54nr/rows.json?accessType=DOWNLOAD';
const MM_URL = 'https://data.ny.gov/api/views/5xaw-6ayf/rows.json?accessType=DOWNLOAD';
const INSERT_SQL = 'INSERT INTO numbers(number,type_id,draw_date,is_ball) VALUES(?,?,?,?)';
const LAST_DATE_SQL = 'SELECT draw_date FROM numbers WHERE type_id = ? ORDER BY draw_date DESC LIMIT 1';

const getLastDate = async (typeId) => {
  const rows = await query(LAST_DATE_SQL,typeId);
  if(!rows[0]) {
    return '0000-00-00';
  }
  return rows[0].draw_date.toISOString().split('T')[0]
}

const insertDB = async (row,typeId,lastDate) => {
  const drawDate = row[DRAW_DATE_INDEX].split('T')[0];

  if(lastDate >= drawDate) { //old data
    return;
  }

  let numberRows = row[NUMBER_INDEX].split(' ');

  //insert mega ball
  if(typeId === MM_TYPE) {
    const megaBall = row[MM_MB_INDEX];
    numberRows.push(megaBall);
  }

  for(let i = 0; i < numberRows.length;i++) {
    const number = numberRows[i];
    console.log((typeId === PB_TYPE ? 'PB' : 'MM') + '::inserting ' + drawDate);
    await query(INSERT_SQL, [number, typeId, drawDate, i === PB_PB_INDEX]);
  }
}

const run = async () => {
  if(process.argv.length < 5) {
    console.log('usage : node app.js {db_host} {db_username} {db_password}');
    return;
  }

  //db connection
  connection = mysql.createConnection({
    host     : process.argv[2],
    user     : process.argv[3],
    password : process.argv[4],
    database : 'lotto'
  });
  connection.connect();
  query = util.promisify(connection.query).bind(connection);

  const lastPBDate = await getLastDate(PB_TYPE);
  const lastMMDate = await getLastDate(MM_TYPE);

  //powerball
  console.log('=== INSERTING PB ===');
  let data = await fetch(PB_URL, {
  }).catch(err => {
    throw err;
  });
  let rows = (await data.json()).data;
  for(const row of rows) {
    await insertDB(row,PB_TYPE,lastPBDate);
  }

  //mm
  console.log('=== INSERTING MM ===');
  data = await fetch(MM_URL, {
  }).catch(err => {
    throw err;
  });
  rows = (await data.json()).data;
  for(const row of rows) {
    await insertDB(row,MM_TYPE,lastMMDate);
  }

  connection.end();
};

run();