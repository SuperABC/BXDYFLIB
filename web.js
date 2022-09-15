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
app.post("/sms",router.sms);
app.get("/login",router.login);
app.post("/login",router.login);
app.get("/register",router.register);
app.post("/register",router.register);
app.post("/sign",router.sign);
app.post("/create",router.create);
app.post("/verify",router.verify);
app.post("/upload",router.upload);
app.post("/send",router.send);
app.post("/result",router.result);
app.post("/page",router.page);
app.post("/detail",router.detail);
app.use(function (req,res) {
    res.render("404");
});

app.listen(80);