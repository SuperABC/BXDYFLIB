function createXmlHttpRequest(){    
    if(window.ActiveXObject){
        return new ActiveXObject("Microsoft.XMLHTTP");    
    }
    else if(window.XMLHttpRequest){ 
        return new XMLHttpRequest();    
    }    
}

function postForData(url, params, response){
    xmlHttpRequest = createXmlHttpRequest();
    xmlHttpRequest.onreadystatechange = response;
    xmlHttpRequest.open("POST",url,true);
    xmlHttpRequest.setRequestHeader('content-type', 'application/json');
    xmlHttpRequest.send(JSON.stringify(params));
}
function postForHtml(url, params){
    var form = document.createElement("form");
    form.action = url;
    form.method = "post";
    form.style.display = "none";
    for (var x in params) {
        var opt = document.createElement("textarea");
        opt.name = x;
        opt.value = params[x];
        form.appendChild(opt);
    }
    document.body.appendChild(form);
    form.submit();
}
function home(){
    postForHtml("index", {"token":window.localStorage.getItem('token')});
}