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
    loadJSON("workshops.json", true, response => {
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
    
    let rootpage = window.location.href.split('?')[0]
    while (rootpage.endsWith("/")) rootpage = rootpage.substring(0, rootpage.length - 1)
    rootpage = rootpage.substring(0, rootpage.lastIndexOf("/"))
    
    forEachShop(prop => {
        let bgstyle = (prop.bg) ? `background:${prop.bg}` : ``
        let fgstyle = (prop.fg) ? `color:${prop.fg}` : ``
        
        out += `<workshopbox style="${bgstyle}">`
        
        out += `<div class="imgBox">`
        out += `<img src="webheaders/${prop.bannerimg}" />`
        out += `</div>`
        
        out += `<div class="infoBox">`
        
        out += `<shopname style="${fgstyle}">${prop.dispname.nonbreakable()}</shopname>`
        out += `<shopinfo style="${fgstyle}">`
        out += `<a style="${fgstyle}" href="https://twitter.com/${prop.twitter}" target="_blank" rel="noopener noreferrer">${'트위터'.nonbreakable()}</a>`
        if (prop.web) {
            out += `&nbsp;|&nbsp;`
            out += `<a style="${fgstyle}" href="${prop.web}" target="_blank" rel="noopener noreferrer">${'홈페이지'.nonbreakable()}</a>`
        }
        out += `&nbsp;|&nbsp;`
        out += `<a style="${fgstyle}" href="${rootpage}/index.html?tags=creator_link is ${prop.twitter}&showwip=true">${'로스터'.nonbreakable()}</a>`
        out += `</shopinfo>`
        
        out += `</div>`
        
        out += `</workshopbox>`
    })
    
    document.getElementById('workshops_roster').innerHTML = out
}
