
var http = require('http');
var querystring = require('querystring');
 
var contents = JSON.stringify({
  to:"18867110457",
  signature:"不休的音符谱",
  templateId: 'login_notify',
  templateData: {
    code: 8888,
  },
});
 
var options = {
    host:'uni.apistd.com',
    path:'/?action=sms.message.send&accessKeyId=n25f6j8iZrQK7vCqV7Z5oWiKecUuYprebUCjZb7NGgypkodsD',
    method:'POST',
    headers:{
        'Content-Type':'application/json'
    }
}
 
var req = http.request(options, function(res){
    res.setEncoding('utf8');
    res.on('data',function(data){
        console.log("data:",data);
    });
});

console.log(contents);
req.write(contents);
req.end();

