var express=require("express");
var app=express();
var router=require("./router")

app.set("view engine","ejs");

app.use(express.static("./upload"));
app.use(express.static("./materialize"));
app.use(express.static("./util"));
app.use(express.static("/public"));


app.get("/",router.home);
app.get("/index",router.home);
app.post("/index",router.index);
app.get("/login",router.login);
app.post("/sign",router.sign);
app.post("/verify",router.verify);
app.post("/upload",router.upload);
app.post("/send",router.send);
app.post("/result",router.result);
app.get("/page",router.page);
app.get("/detail",router.detail);
app.use(function (req,res) {
    res.render("404");
});

app.listen(80);