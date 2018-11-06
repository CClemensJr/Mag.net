'use strict'

const express = require('express');
const pg = require('pg');
const cors = require('cors');
const superagent = require('superagent');
require(`dotenv`).config();

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('err', err => console.log(err));

let app = express();
app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
app.use(cors());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`app is up on${PORT}`));

// app.get('/', loadUser);
app.get('/', loadMagnets);


// app.post('/meme', fetchMemeAPI)
//This retrieves and returns data from Meme API
function fetchMemeAPI(req, res) {
  const meme_URL = `https://api.imgflip.com/get_memes`;
  return superagent.get(meme_URL)
    .then(results => {
      if (results.data.memes.length > 0) {
        const formattedResults = results.data.memes.slice(4, 8).map(result => {
          return new Magnet(result.url, 6, 7, 2);
          // return new Magnet(result.url, x, y, 2);
        });
        return res.render('pages/searches/show', { memes: formattedResults});
      } else {
        throw 'no results returned...sorry';
      }
    })
    .catch(err => handleError(err, res));

}

function loadMagnets(req, res) {
  // const magArray = [];
  // let types = 0;
  let magnets = {
    alphabet: [],
    word: [],
    meme: []
  }
  client.query(`SELECT content, x, y, type FROM magnets JOIN magnet_types ON magnets.type_id=magnet_types.id`)
    .then( result =>{
      result.rows.forEach(element =>{
        magnets[element.type].push(element)
      })
      console.log(magnets);
      // res.render('/ejsSomething', magnets);
      //TODO: CARLOS make sure you uncomment above and put an ACTUAL link to pages/

      // magArray.push(result.rows);
      // console.log(magArray);
    })
    .catch(err => handleError(err, res));
  res.send('Howdy again');
}

function loadUser(req, res) {
  client.query('SELECT * FROM users;')
  return client.query()
    .then( results => {
      res.render('./index.ejs', {data: results.rows[0]});
    })
    .catch(err => handleError(err, res));
}

function Magnet(content, x, y, type_id){
  this.content = content;
  this.x = x;
  this.y = y;
  this.type_id = type_id;
}

Magnet.prototype.save = function() {
  const SQL = `INSERT INTO magnets(content, x, y, type_id) VALUES ($1, $2, $3, $4);`;
  const values = Object.values(this);

  client.query(SQL, values);
}

// For errrors
function handleError(err, res) {
  console.log('Oh oh error! Try unpluggin then pluggin back in', err);
  res.render('pages/error');
}


