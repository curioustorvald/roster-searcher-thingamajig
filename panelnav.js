// 외부 JSON 가져오기
// Localhost에서 작동시킬 시 보안 문제로 로딩 안될 수 있음. 보안 설정을 잠깐 끄거나 서버에 올려서 돌리시오.
function loadJSON(jsonPath, isAsync, callback) {   
    let xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    xobj.open('GET', jsonPath, isAsync);
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
}

function panelnavinit() {
    loadJSON("panels.json", true, response => {
        populateNav(JSON.parse(response));
    })
}

function populateNav(db) {
    let currentPage = location.href.split("/").slice(-1);
    let output = `<div class="sub_content"><ul class="sub_menu">`
    
    Object.keys(db).forEach(id => {
        let css_class = (currentPage == db[id].path) ? "sub_link selected" : "sub_link";
        output += `<li class="columngap"><a href="${db[id].path}" class="${css_class}">${db[id].label}</a></li>`
    })
    
    output += "</ul></div>"
    
    document.getElementById("panelnav").innerHTML = output
}