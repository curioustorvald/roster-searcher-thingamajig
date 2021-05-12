"use strict";

function loadJSON(jsonPath, isAsync, callback) {   
    let xobj = new XMLHttpRequest()
        xobj.overrideMimeType("application/json")
    xobj.open('GET', jsonPath, isAsync)
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText)
          }
    }
    xobj.send(null)
}

String.prototype.nonbreakable = function() {
    return this.split('').join('&NoBreak;').replaceAll(' ', '&nbsp;')
}

var workshops = {}

function forEachShop(action) {
    Object.keys(workshops).forEach(v => action(workshops[v]))
}

function mapShops(transformation) {
    return Object.keys(workshops).map(v => transformation(workshops[v]))
}

function filterShops(predicate) {
    return Object.keys(workshops).filter(v => predicate(workshops[v]))
}

function workshopsinit() {
    loadJSON("workshops.json", false, response => {
        let w = JSON.parse(response)
        
        // filter closed shops
        Object.entries(w).forEach(kv=>{
            if (kv[1].dispname !== undefined) {
                workshops[kv[0]] = kv[1]
            }
        })
                
        makeWorkshopsList()
    })
}

function makeWorkshopsList() {
    let out = ``
    
    forEachShop(prop => {
        out += `<workshopbox style="background:${prop.bg}">`
        
        out += `<div class="imgBox">`
        out += `<img src="webheaders/${prop.bannerimg}" />`
        out += `</div>`
        
        out += `<div class="infoBox">`
        
        out += `<shopname style="color: ${prop.fg}">${prop.dispname}</shopname>`
        
        out += `<shopinfo style="color: ${prop.fg}">`
        out += `<a style="color: ${prop.fg}" href="https://twitter.com/${prop.twitter}" target="_blank" rel="noopener noreferrer">트위터</a>`
        if (prop.web) {
            out += `&nbsp;|&nbsp;`
            out += `<a style="color: ${prop.fg}" href="${prop.web}" target="_blank" rel="noopener noreferrer">홈페이지</a>`
        }
        out += `</shopinfo>`
        
        out += `</div>`
        
        out += `</workshopbox>`
    })
    
    document.getElementById('workshops_roster').innerHTML = out
}
