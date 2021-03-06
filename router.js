var PAGE_SIZE = 5;

var fs=require("fs");
var url = require('url');
var formidable=require("formidable");
var mysql = require('mysql')
var decodeImage = require('jimp').read;
var qrcodeReader = require('qrcode-reader');
var db = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'password',
    database: 'spectrum'
  })
exports.indexPage=function(req,res){
    db.query("select count(*) from spectrum.qrcode", (err, results) => {
        if(err){
            return;
        }
        res.render("index", {
            "total":{
                "num":results[0]['count(*)']
            }
        });
    });
};
exports.upload=function (req,res) {
    res.render("upload", {
        "msg": {}
    })
}
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
            res.render("upload", {
                "msg": { msg : "数据有误"}
            });
            return;
        }
        var size=parseInt(files.qr_code.size);
        if (size>2*1024*1024){
            fs.unlink(files.qr_code. _writeStream.path, function(){});
            res.render("upload", {
                "msg": { msg : "图片过大"}
            })
            return;
        }
        decodeImage(files.qr_code. _writeStream.path,function(err,image){
            if(err){
                fs.unlink(files.qr_code. _writeStream.path, function(){});
                res.render("upload", {
                    "msg": { msg : "图片格式有误"}
                })
                return;
            }
            let decodeQR = new qrcodeReader();
            decodeQR.callback = function(err, result) {
                if (err) {
                    fs.unlink(files.qr_code. _writeStream.path, function(){});
                    res.render("upload", {
                        "msg": { msg : "无法识别二维码"}
                    })
                    return;
                }
                if (result){
                    var qr_content = result.result;
                    if(result.result.search("lsopenapi.xnhdgame.com")==-1){
                        fs.unlink(files.qr_code. _writeStream.path, function(){});
                        res.render("upload", {
                            "msg": { msg : "该二维码不是不休的音符二维码"}
                        })
                        return;
                    }
                    var sql7 = 'select * from spectrum.qrcode where qr_content = \'' + qr_content + '\'';
                    db.query(sql7, (err, results) => {
                        if (err) {
                            fs.unlink(files.qr_code. _writeStream.path, function(){});
                            res.render("upload", {
                                "msg": { msg : "数据有误"}
                            });
                            return;
                        }

                        if(results.length > 0){
                            fs.unlink(files.qr_code. _writeStream.path, function(){});
                            res.render("upload", {
                                "msg": { msg : "该曲谱二维码已收录，请勿重复上传"}
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
                                fs.unlink("upload/" + file_name, function(){});
                                res.render("upload", {
                                    "msg": { msg : "数据冲突"}
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
                                            return;
                                        }
                                    });
                                }
                            }
                            res.render("upload", {
                                "msg": { msg : "上传成功"}
                            })
                            return;
                        });
                    });
                }      
            };    
            decodeQR.decode(image.bitmap);
        });
    });
}
exports.result=function (req,res) {
    var form=new formidable.IncomingForm();
    form.encoding='utf-8';
    form.parse(req,function (err,fields,files,next) {
        if (err){
            return;
        };
        var sql = 'SELECT * from qrcode';
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
              return console.log(err.message);
            }
            var qrs = [];
            for(var i in results.slice(0, PAGE_SIZE)){
                qrs.push({
                    "qr_path" : results[i].qr_path,
                    "song_name" : results[i].song_name,
                    "song_author" : results[i].song_author,
                    "song_bpm" : results[i].song_bpm,
                    "spectrum_author" : results[i].spectrum_author,
                    "sample_video" : results[i].sample_video
                });
            }
            res.render("search",{
                "result" : qrs,
                "page" : 1,
                "pn" : results.length / PAGE_SIZE,
                "total" : results.length,
                "query" : {
                    "song_name" : fields.song_name,
                    "song_author" : fields.song_author,
                    "spectrum_author" : fields.spectrum_author,
                    "song_difficulty" : fields.song_difficulty
                }
            });
        });
    });
}
exports.page=function (req,res) {
    var args = url.parse(req.url, true).query;
    var sql = 'SELECT * from qrcode';
    var where = true;
    if(args.sn){
        if(where){
            sql += ' where ';
            where = false;
        }
        else sql += ' and '
        sql += 'song_name like \'%' + args.sn + '%\'';
    }
    if(args.sa){
        if(where){
            sql += ' where ';
            where = false;
        }
        else sql += ' and '
        sql += 'song_author like \'%' + args.sa + '%\'';
    }
    if(args.sp){
        if(where){
            sql += ' where ';
            where = false;
        }
        else sql += ' and '
        sql += 'spectrum_author like \'%' + args.sp + '%\'';
    }
    if(args.sd){
        if(where){
            sql += ' where ';
            where = false;
        }
        else sql += ' and '
        sql += args.sd + ' in (select song_difficulty from spectrum.difficulty where spectrum.difficulty.song_id = spectrum.qrcode.id)';
    }
    db.query(sql, (err, results) => {
        if (err) {
          return console.log(err.message);
        }
        var qrs = [];
        var resultTmp = results.slice((args.page - 1) * PAGE_SIZE, args.page * PAGE_SIZE);
        for(var i in resultTmp){
            qrs.push({
                "qr_path" : resultTmp[i].qr_path,
                "song_name" : resultTmp[i].song_name,
                "song_author" : resultTmp[i].song_author,
                "song_bpm" : resultTmp[i].song_bpm,
                "spectrum_author" : resultTmp[i].spectrum_author,
                "sample_video" : resultTmp[i].sample_video
            });
        }
        res.render("search",{
            "result":qrs,
            "page" : args.page,
            "pn" : results.length / PAGE_SIZE,
            "total" : results.length,
            "query" : {
                "song_name" : args.sn,
                "song_author" : args.sa,
                "spectrum_author" : args.sp,
                "song_difficulty" : args.sd
            }
        });
    });
}