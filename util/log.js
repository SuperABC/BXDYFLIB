function verify(url){
    postForHtml(url, {"token":window.localStorage.getItem('token')});
}
function logout(){
    window.localStorage.setItem('token', '');
    window.location.href='index';
}