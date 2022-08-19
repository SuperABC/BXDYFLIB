var jwt = require('jsonwebtoken')
let user = { username: 'wkj' }; // 要生成token的主题信息
let secretOrPrivateKey = "suiyi" // 这是加密的key（密钥） 
let token = jwt.sign(user, secretOrPrivateKey, {
        expiresIn: 1  // 1小时过期
    });
var oneSecond = 1000;
setTimeout(function() {
    let ret = {}; // 从token获取的主题信息
    jwt.verify(token, secretOrPrivateKey, (err, decode) => {
      if(err){
        ret = err
      } else {
        ret = decode
      }
    })
    console.log(ret)
}, oneSecond);