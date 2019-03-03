
require('dotenv').config();
var mastodon = require(__dirname + '/mastodon.js');
var axios = require('axios');


const id = '2014706277';

axios.get('https://www.loc.gov/item/' + id + '?fo=json')
      .then(res => {
      	const locData = res.data.item;
      	//console.log(locData);
      	//mastodon.toot('test!', id, JSON.stringify(locData));
      	mastodon.toot('test!', id);
      });


//mastodon.toot('test!', '2014693395');

