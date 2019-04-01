const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');

app.use(bodyParser.json());

app.get('/', function (req, res) {
  const reply = {
      "status": "ok"
  };
  res.json(reply);
});

app.post('/action-endpoint', function (req, res) {
  const challenge = req.body.challenge; // this challenge is needed to ensure slack that our bot works
  
  const reply = {
      "challenge": challenge
  };

  const headers = {
    'Content-type': 'application/json',
    'Authorization': `Bearer ${process.env.TOKEN}` // this token you need to set on heroku
  }

  // console.log(req.body.event);

  if (req.body.event.subtype != 'bot_message') { // se we won't reply to ourselves...
    const [multiplier, currency] = req.body.event.text.split(" ");
  
    request.get(`https://api.coindesk.com/v1/bpi/currentprice/${currency.toUpperCase()}.json`, function(err, res, body) {
      let responseText;
      if (err) {
        console.log(err);
      }
      else {
        try{
          const coindesk = JSON.parse(body);
          const rate = coindesk.bpi[currency.toUpperCase()].rate.replace(",", "");
          responseText = `Current BTC rate: ${rate*multiplier} ${currency.toUpperCase()} per ${multiplier} BTC`
          
        }
        catch(err){
          responseText = "Invalid input";
        }
        const reply = {
          'channel': req.body.event.channel,
          text: responseText 
        }
        

        const options = {
          url:   'https://slack.com/api/chat.postMessage',
          method: 'POST',
          headers,
          body:  JSON.stringify(reply)
        };

        console.log(body);
    
        request.post(options, function(err, res, body) {
          if (err) {
            console.log(err);
          }
        });
      }
    });
  }
  res.json(reply);
});

const listener = app.listen(process.env.PORT || '3000', function () {
  console.log('Your app is listening on port ' + listener.address().port);
});