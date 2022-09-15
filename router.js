var PAGE_SIZE = 20;

var fs = require('fs');
var url = require('url');
var formidable = require('formidable');
var mysql = require('mysql')
var decodeImage = require('jimp').read;
var qrcodeReader = require('qrcode-reader');
var jwt = require('jsonwebtoken')
var NodeCache = require( "node-cache" );
var myCache = new NodeCache();

var db = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'password',
    database: 'spectrum'
});
var jwtkey = 'sg';

function getQueryVariable(url, variable) {
    var query = decodeURI(url);
    var vars = query.split('&');
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split('=');
        if(pair[0] == variable){return pair[1];}
    }
}

// get html
// return:
// {
//     num:曲谱总数
//     verify:用户信息验证
// }
exports.home=function(req,res){
    db.query('select count(*) from spectrum.qrcode', (err, results) => {
        if(err){
            console.log(sql)
            console.log(err.message);
            console.log();
            res.render('index', {
                'num':0,
                'verify': {}
            });
            return;
        }
        res.render('index', {
            'num':results[0]['count(*)'],
            'verify': {}
        });
    });
};
// post html
// input:
// {
//     token:用户令牌
// }
// return:
// {
//     num:曲谱总数
//     verify:用户信息验证
// }
exports.index=function(req,res){
    var postData = '';
    req.on('data', function (chuck) {  
        postData += chuck;
    });
    req.on('end', function () {
        db.query('select count(*) from spectrum.qrcode', (err, results) => {
            if(err){
                console.log(sql)
                console.log(err.message);
                console.log();
                res.render('index', {
                    'num':results[0]['count(*)'],
                    'verify': {}
                });
                return;
            }
            var token = getQueryVariable(postData, 'token');
            jwt.verify(token, jwtkey, (err, decode) => {
                if(err){
                    res.render('index', {
                        'num':results[0]['count(*)'],
                        'verify': {}
                    });
                }
                else {
                    res.render('index', {
                        'num':results[0]['count(*)'],
                        'verify': decode
                    });
                }
            });
        });
    });
};
// post data
// input:
// {
//     phone:手机号,
// }
// return:
// {
//     result:发送结果
// }
exports.sms=function(req,res){
    var postData = '';
    req.on('data', function (chuck) {  
        postData += chuck;
    });
    req.on('end', function () {
        var data = JSON.parse(postData);
        var phone = data["phone"];

        myCache.set(phone, "123456", 600);
        res.json({
            "result":"success"
        });
    });
}
// get html
exports.login=function(req,res){
    res.render('login', {})
}
// get html
exports.register=function(req,res){
    res.render('register', {})
}
// post data
// input:
// {
//     user:用户名,
//     pw:密码
// }
// return:
// {
//     result:登录结果
//     token:用户令牌
// }
exports.sign=function(req,res){
    var postData = '';
    req.on('data', function (chuck) {  
        postData += chuck;
    });
    req.on('end', function () {
        var data = JSON.parse(postData);
        var sql = 'select * from user where username = \'' + data['user'] + '\' and pwsha = \'' + data['pw'] + '\'';
        db.query(sql, (err, results) => {
            if(err){
                console.log(sql)
                console.log(err.message);
                console.log();
                res.json({
                    'result':'fail',
                    'token':''
                });
                return;
            }
            if(results.length > 0){
                let user = { username: data['user'] };
                let token = jwt.sign(user, jwtkey, {
                    expiresIn: 60*60*1
                });
                res.json({
                    'result':'success',
                    'token':token
                });
            }
            else{
                res.json({
                    'result':'fail',
                    'token':''
                });
            }
        });
    });
}
// post data
// input:
// {
//     user:用户名,
//     pw:密码,
//     nick:昵称,
//     phone:手机号
// }
// return:
// {
//     result:注册结果
//     msg:结果信息
// }
exports.create=function(req,res){
    var postData = '';
    req.on('data', function (chuck) {  
        postData += chuck;
    });
    req.on('end', function () {
        var data = JSON.parse(postData);
        var user = data['user'];
        var pw = data['pw'];
        var phone = data['phone'];
        var code = data['code'];
        var nick = data['nick'];

        var cc = myCache.get(phone);
        if (cc == undefined){
            res.json({
                'result':'fail',
                'msg':'请先接收验证码。'
            });
            return;
        }
        else{
            if(code != cc){
                res.json({
                    'result':'fail',
                    'msg':'验证码错误。'
                });
                return;
            }
        }

        sql = 'insert into user(username, pwsha, nick, phone) values(\'' +
            user + '\', \'' + pw + '\', \'' + nick + '\', \'' + phone + '\')';
        db.query(sql, (err, results) => {
            if(err){
                res.json({
                    'result':'fail',
                    'msg':'用户信息已存在。'
                });
            }
            else{
                res.json({
                    'result':'success',
                    'msg':'账户创建成功。'
                });
            }
        });
    });
}
// post data
// input:
// {
//     token:用户令牌
// }
// return:
// {
//     result:验证结果
// }
exports.verify=function (req,res) {
    var postData = '';
    req.on('data', function (chuck) {  
        postData += chuck;
    });
    req.on('end', function () {
        var token = JSON.parse(postData)['token'];
        jwt.verify(token, jwtkey, (err, decode) => {
            if(err){
                res.json({
                    'result':'fail'
                });
            }
            else {
                res.json({
                    'result':'success'
                });
            }
        });
    });
}
// post html
// input:
// {
//     token:用户令牌
// }
// return:
// {
//     msg:结果消息
//     verify:用户信息验证
// }
exports.upload=function (req,res) {
    var postData = '';
    req.on('data', function (chuck) {  
        postData += chuck;
    });
    req.on('end', function () {
        var token = getQueryVariable(postData, 'token');
        jwt.verify(token, jwtkey, (err, decode) => {
            if(err){
                res.render('upload', {
                    'msg': {},
                    'verify': {}
                });
            }
            else {
                res.render('upload', {
                    'msg': {},
                    'verify': decode
                });
            }
        });
    });
}
// post html
// input:
// {
//     form:上传信息
//     token:用户令牌
// }
// return:
// {
//     msg:结果消息
//     verify:用户信息验证
// }
exports.send=function (req,res) {
    var form=new formidable.IncomingForm();
    form.encoding='utf-8';
    var date = new Date();
    var dateFolder = '' + date.getFullYear() +'_' + (date.getMonth() + 1) + '_' + date.getDate() + '/';
    form.uploadDir='./upload/' + dateFolder;
    var getFileRealPath = function(s){
        try {return fs.realpathSync(s);} catch(e){return false;}
    }
    if((getFileRealPath(form.uploadDir)) === false){
        fs.mkdir(form.uploadDir, function(){});
    }
    form.keepExtensions=true;
    form.parse(req,function (err,fields,files,next) {
        if(err){
            fs.unlink(files.qr_code. _writeStream.path, function(){});
            res.render('upload', {
                'msg': { msg : '数据有误'},
                'verify':{}
            });
            return;
        }
        var token = fields.token;
        var verify = {}
        jwt.verify(token, jwtkey, (err, decode) => {
            if(!err){
                verify = decode
            }
            var size=parseInt(files.qr_code.size);
            if (size>2*1024*1024){
                fs.unlink(files.qr_code. _writeStream.path, function(){});
                res.render('upload', {
                    'msg': { msg : '图片过大'},
                    'verify':verify
                })
                return;
            }
            decodeImage(files.qr_code. _writeStream.path,function(err,image){
                if(err){
                    fs.unlink(files.qr_code. _writeStream.path, function(){});
                    res.render('upload', {
                        'msg': { msg : '图片格式有误'},
                        'verify':verify
                    })
                    return;
                }
                let decodeQR = new qrcodeReader();
                decodeQR.callback = function(err, result) {
                    if (err) {
                        fs.unlink(files.qr_code. _writeStream.path, function(){});
                        res.render('upload', {
                            'msg': { msg : '无法识别二维码'},
                            'verify':verify
                        })
                        return;
                    }
                    if (result){
                        var qr_content = result.result;
                        if(result.result.search('lsopenapi.xnhdgame.com')==-1){
                            fs.unlink(files.qr_code. _writeStream.path, function(){});
                            res.render('upload', {
                                'msg': { msg : '该二维码不是不休的音符二维码'},
                                'verify':verify
                            })
                            return;
                        }
                        var sql7 = 'select * from spectrum.qrcode where qr_content = \'' + qr_content + '\'';
                        db.query(sql7, (err, results) => {
                            if (err) {
                                console.log(sql)
                                console.log(err.message);
                                console.log();
                                fs.unlink(files.qr_code. _writeStream.path, function(){});
                                res.render('upload', {
                                    'msg': { msg : '数据库查询异常'},
                                    'verify':verify
                                });
                                return;
                            }
    
                            if(results.length > 0){
                                fs.unlink(files.qr_code. _writeStream.path, function(){});
                                res.render('upload', {
                                    'msg': { msg : '该曲谱二维码已收录，请勿重复上传'},
                                    'verify':verify
                                });
                                return;
                            }
    
                            var file_name = fields.song_name + '_';
                            while(true){
                                var tmp_name = file_name + Math.floor(Math.random()*100000000);
                                var exist = true;
                                if((getFileRealPath(form.uploadDir + tmp_name)) === false){
                                    exist = false;
                                }
                                if(!exist){
                                    file_name = tmp_name;
                                    break;
                                }
                            }
                            fs.rename(files.qr_code. _writeStream.path, form.uploadDir + file_name, function(){})
                            var sql1 = 'insert into spectrum.qrcode(qr_path, qr_content, song_name';
                            var sql2 = ') values(';
                            var sql3 = ');';
                            sql2 += '\'' + dateFolder + file_name + '\'';
                            sql2 += ', \'' + qr_content + '\'';
                            sql2 += ', \'' + fields.song_name + '\'';
                            if(fields.song_author!=''){
                                sql1 += ', song_author';
                                sql2 += ', \'' + fields.song_author + '\'';
                            }
                            if(fields.song_bpm!=''){
                                sql1 += ', song_bpm';
                                sql2 += ', ' + Number(fields.song_bpm);
                            }
                            if(fields.spectrum_author!=''){
                                sql1 += ', spectrum_author';
                                sql2 += ', \'' + fields.spectrum_author + '\'';
                            }
                            if(fields.sample_video!=''){
                                sql1 += ', sample_video';
                                sql2 += ', \'' + fields.sample_video + '\'';
                            }
                            db.query(sql1 + sql2 + sql3, (err, results) => {
                                if (err) {
                                    console.log(sql)
                                    console.log(err.message);
                                    console.log();
                                    fs.unlink('upload/' + file_name, function(){});
                                    res.render('upload', {
                                        'msg': { msg : '数据库插入异常'},
                                        'verify':verify
                                    });
                                    return;
                                }
                                    
                                if(fields.song_difficulty!=''){
                                    difficulties = fields.song_difficulty.split(',');
                                    for(var i in difficulties){
                                        var sql4 = 'insert into spectrum.difficulty(song_id, song_difficulty) select id, ';
                                        var sql5 = ' from spectrum.qrcode where qr_path = \'';
                                        var sql6 = '\';';
                                        sql4 += Number(difficulties[i]);
                                        sql5 += dateFolder + file_name;
                                        db.query(sql4 + sql5 + sql6, (err, results) => {
                                            if (err) {
                                                console.log(sql)
                                                console.log(err.message);
                                                console.log();
                                                res.json({
                                                    'msg':{ msg : '数据库插入异常'},
                                                    'verify':verify
                                                });
                                                return;
                                            }
                                        });
                                    }
                                }
                                res.render('upload', {
                                    'msg': { msg : '上传成功'},
                                    'verify':verify
                                })
                                return;
                            });
                        });
                    }      
                };    
                decodeQR.decode(image.bitmap);
            });
        });
    });
}
// post html
// input:
// {
//     form:查询信息
//     token:用户令牌
// }
// return:
// {
//     result:查询结果
//     page:当前页面
//     total:页面总数
//     query:查询信息
//     verify:用户信息验证
// }
exports.result=function (req,res) {
    var form=new formidable.IncomingForm();
    form.encoding='utf-8';
    form.parse(req,function (err,fields,files,next) {
        if (err){
            res.render('search', {
                'result' : [],
                'page' : 1,
                'total' : 1,
                'query' : {
                    'song_name' : fields.song_name,
                    'song_author' : fields.song_author,
                    'spectrum_author' : fields.spectrum_author,
                    'song_difficulty' : fields.song_difficulty
                },
                'verify':{}
            });
            return;
        };
        var token = fields.token;
        var verify = {}
        jwt.verify(token, jwtkey, (err, decode) => {
            if(!err){
                verify = decode
            }
            var sql = 'select * from qrcode';
            var where = true;
            if(fields.song_name){
                if(where){
                    sql += ' where ';
                    where = false;
                }
                else sql += ' and '
                sql += 'song_name like \'%' + fields.song_name + '%\'';
            }
            if(fields.song_author){
                if(where){
                    sql += ' where ';
                    where = false;
                }
                else sql += ' and '
                sql += 'song_author like \'%' + fields.song_author + '%\'';
            }
            if(fields.spectrum_author){
                if(where){
                    sql += ' where ';
                    where = false;
                }
                else sql += ' and '
                sql += 'spectrum_author like \'%' + fields.spectrum_author + '%\'';
            }
            if(fields.song_difficulty){
                if(where){
                    sql += ' where ';
                    where = false;
                }
                else sql += ' and '
                sql += fields.song_difficulty + ' in (select song_difficulty from spectrum.difficulty where spectrum.difficulty.song_id = spectrum.qrcode.id)';
            }
            db.query(sql, (err, results) => {
                if (err) {
                    console.log(sql)
                    console.log(err.message);
                    console.log();
                    res.render('search',{
                        'result' : [],
                        'page' : 1,
                        'total' : 1,
                        'query' : {},
                        'verify':verify
                    });
                    return;
                }
                var qrs = [];
                for(var i in results.slice(0, PAGE_SIZE)){
                    qrs.push({
                        'id' : results[i].id,
                        'qr_path' : results[i].qr_path,
                        'song_name' : results[i].song_name,
                        'song_author' : results[i].song_author,
                        'song_bpm' : results[i].song_bpm,
                        'spectrum_author' : results[i].spectrum_author,
                        'sample_video' : results[i].sample_video
                    });
                }
                res.render('search',{
                    'result' : qrs,
                    'page' : 1,
                    'total' : Math.max(1, Math.ceil(results.length / PAGE_SIZE)),
                    'query' : {
                        'song_name' : fields.song_name,
                        'song_author' : fields.song_author,
                        'spectrum_author' : fields.spectrum_author,
                        'song_difficulty' : fields.song_difficulty
                    },
                    'verify':verify
                });
            });
        });
    });
}
// post html
// input:
// {
//     song_name:歌曲名,
//     song_author:歌曲作者,
//     spectrum_author:曲谱作者,
//     song_difficulty:歌曲难度,
//     page:当前页面,
//     token:用户令牌
// }
// return:
// {
//     result:查询结果
//     page:当前页面
//     total:页面总数
//     query:查询信息
//     verify:用户信息验证
// }
exports.page=function (req,res) {
    var postData = '';
    req.on('data', function (chuck) {  
        postData += chuck;
    });
    req.on('end', function () {
        var token = getQueryVariable(postData, 'token');
        var verify = {}
        jwt.verify(token, jwtkey, (err, decode) => {
            if(!err){
                verify = decode;
            }
            var sql = 'SELECT * from qrcode';
            var where = true;
            var song_name = getQueryVariable(postData, 'song_name');
            var song_author = getQueryVariable(postData, 'song_author');
            var spectrum_author = getQueryVariable(postData, 'spectrum_author');
            var song_difficulty = getQueryVariable(postData, 'song_difficulty');
            if(song_name){
                if(where){
                    sql += ' where ';
                    where = false;
                }
                else sql += ' and '
                sql += 'song_name like \'%' + song_name + '%\'';
            }
            if(song_author){
                if(where){
                    sql += ' where ';
                    where = false;
                }
                else sql += ' and '
                sql += 'song_author like \'%' + song_author + '%\'';
            }
            if(spectrum_author){
                if(where){
                    sql += ' where ';
                    where = false;
                }
                else sql += ' and '
                sql += 'spectrum_author like \'%' + spectrum_author + '%\'';
            }
            if(song_difficulty){
                if(where){
                    sql += ' where ';
                    where = false;
                }
                else sql += ' and '
                sql += song_difficulty + ' in (select song_difficulty from spectrum.difficulty where spectrum.difficulty.song_id = spectrum.qrcode.id)';
            }
            db.query(sql, (err, results) => {
                if (err) {
                    console.log(sql)
                    console.log(err.message);
                    console.log();
                    res.render('search',{
                        'result' : [],
                        'page' : 1,
                        'total' : 1,
                        'query' : {},
                        'verify':verify
                    });
                    return;
                }
                var qrs = [];
                var page = getQueryVariable(postData, 'page');
                var resultTmp = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
                for(var i in resultTmp){
                    qrs.push({
                        'id' : resultTmp[i].id,
                        'qr_path' : resultTmp[i].qr_path,
                        'song_name' : resultTmp[i].song_name,
                        'song_author' : resultTmp[i].song_author,
                        'song_bpm' : resultTmp[i].song_bpm,
                        'spectrum_author' : resultTmp[i].spectrum_author,
                        'sample_video' : resultTmp[i].sample_video
                    });
                }
                res.render('search',{
                    'result':qrs,
                    'page' : page,
                    'total' : Math.max(1, Math.ceil(results.length / PAGE_SIZE)),
                    'query' : {
                        'song_name' : song_name,
                        'song_author' : song_author,
                        'spectrum_author' : spectrum_author,
                        'song_difficulty' : song_difficulty
                    },
                    'verify':verify
                });
            });
        });
    });
}
// post html
// input:
// {
//     id:曲谱索引,
//     token:用户令牌
// }
// return:
// {
//     result:曲谱信息
//     verify:用户信息验证
// }
exports.detail=function (req,res) {
    var postData = '';
    req.on('data', function (chuck) {  
        postData += chuck;
    });
    req.on('end', function () {
        var token = getQueryVariable(postData, 'token');
        var verify = {}
        jwt.verify(token, jwtkey, (err, decode) => {
            if(!err){
                verify = decode;
            }
            var sql = 'SELECT * from qrcode where id = ' + getQueryVariable(postData, 'id');
            
            db.query(sql, (err, results) => {
                if (err) {
                    console.log(sql)
                    console.log(err.message);
                    console.log();
                    res.render('detail',{
                        'result':{
                            'qr_path':"",
                            'song_name':"",
                            'song_author':"",
                            'song_bpm':"",
                            'spectrum_author':"",
                            'sample_video':""
                        },
                        'verify':verify
                    });
                    return;
                }
                var qrs = {
                    'qr_path' : results[0].qr_path,
                    'song_name' : results[0].song_name,
                    'song_author' : results[0].song_author,
                    'song_bpm' : results[0].song_bpm,
                    'spectrum_author' : results[0].spectrum_author,
                    'sample_video' : results[0].sample_video
                };
                res.render('detail',{
                    'result':qrs,
                    'verify':verify
                });
            });
        });
    });
}