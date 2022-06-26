var express=require("express");
var app=express();
var router=require("./router")

app.set("view engine","ejs");

app.use(express.static("./upload"));
app.use(express.static("./materialize"));
app.use(express.static("/public"));


app.get("/",router.indexPage);
app.get("/upload",router.upload);
app.post("/send",router.send);
app.post("/result",router.result);
app.get("/page",router.page);
app.use(function (req,res) {
    res.render("404");
});

app.listen(80);