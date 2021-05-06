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

const dropdownStyle = ["Cyber","Kemo","Kemo Toon","Toon","Semi","Real","Real Toon"]

const workshopThemeCol = {
    "아토아마":"#AFC930",
    "케이라인":"#004E90",
    "모치리":"#99F5DB",
    "이누코보":"#D28D1F",
    "블루폭스":"#00A0EA",
    "제로케모":"#F2B218",
    "아흔":"#999999",
    "티거":"#EFEFEF",
    "SIN":"#AC4EEE",
    "라이칸":"#434343",
    "아설":"#FFE926",
    "키루":"#79491B",
    "Yohen":"#65DAF1",
    "라온":"#C5DDFC",
    "소지":"#85ECDC",
    "Tio":"#8FC9C8",
    "후루츠허브":"#EAD1DC",
    "내장":"#7D0182",
    "바토":"#FFD1F7",
    "Ohiya":"#FF7300",
    "뻐꾹":"#CCCCCC",
    "개만두":"#D02C2B",
    "세논":"#2AC99A",
    "도운":"#329552",
    "레윈":"#FD3627"
}

function htmlColToLum(text) {
    let r = parseInt("0x"+text.substring(1,3)) / 255.0
    let g = parseInt("0x"+text.substring(3,5)) / 255.0
    let b = parseInt("0x"+text.substring(5,7)) / 255.0
    return (3*r + 4*g + b) / 8.0
}

function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }
    if (typeof step == 'undefined') {
        step = 1;
    }
    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }
    var result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }
    return result;
};

var furdb = {}

function forEachFur(action) {
    Object.keys(furdb).filter(i => !isNaN(i)).forEach(v => action(furdb[v]))
}

function mapFurs(transformation) {
    return Object.keys(furdb).filter(i => !isNaN(i)).map(v => transformation(furdb[v]))
}

function filterFurs(predicate) {
    return Object.keys(furdb).filter(i => !isNaN(i)).filter(v => predicate(furdb[v]))
}

function statsinit() {
    loadJSON("furdb.json", true, response => {
        furdb = JSON.parse(response)
        
        // must be here because db load is asynchronous        
        populateStatsText()
        populateBirthdayStatTable()
        populateStyleStatTable()
        populateMarketshareTable()
    })
}

function template(strings, ...keys) {
    return (function(...values) {
        let dict = values[values.length - 1] || {}
        let result = [strings[0]]
        keys.forEach(function(key, i) {
            let value = Number.isInteger(key) ? values[key] : dict[key]
            result.push(value, strings[i + 1])
        })
        return result.join('')
    })
}

function populateStatsText() {
    document.getElementById("lastupdate_text").innerHTML = furdb.last_update
    document.getElementById("recordcount_text").innerHTML = Object.keys(furdb).length - 1
    //document.getElementById("missingno_text").innerHTML = [...Array(Object.keys(furdb).length - 1).keys()].map(i => i+1).filter(i => furdb[i] === undefined).join(' ')
}

function populateBirthdayStatTable() {
    let out = ''
    
    for (let year = 2015; year <= new Date().getFullYear(); year++) {
        let count = filterFurs(prop => prop.birthday.startsWith(''+year)).length
        out += `<tr>`
        out += `<td class="tableChartLabel">${year}</td>`
        out += `<td class="tableBarChartArea"><div class="tableBarChart" style="width:${count}px">&nbsp;</div>&nbsp;<div class="tableDataNumber">${count}</div></td>`
        out += `</tr>`
    }
    
    document.getElementById("birthday_stat_table").innerHTML = out
}

function populateStyleStatTable() {
    let out = ''
    
    dropdownStyle.forEach(style => {
        let count = filterFurs(prop => prop.style == style).length
        out += `<tr>`
        out += `<td class="tableChartLabel">${style}</td>`
        out += `<td class="tableBarChartArea"><div class="tableBarChart" style="width:${count}px">&nbsp;</div>&nbsp;<div class="tableDataNumber">${count}</div></td>`
        out += `</tr>`
    })
    
    document.getElementById("style_stat_table").innerHTML = out
}

function populateMarketshareTable() {
    let barHeight = 48
    let fontSize = 14
    let padding = (barHeight - fontSize - 6) / 2
    
    let out = ''
    
    let data = {/*
        "2016": {"아토아마":0,"케이라인":0,"모치리":0 ...},
        "2017": {"아토아마":1,"케이라인":0,"모치리":0 ...} ...
    */}
    // create dataset
    forEachFur(prop => {
        if (prop.birthday !== undefined && prop.creator_name !== undefined) {
            let year = prop.birthday.substring(0,4)
            let sanitisedCreatorName = prop.creator_name.split('/')[0]
            
            if (Object.keys(workshopThemeCol).includes(sanitisedCreatorName)) {
                if (!data[year]) data[year] = {}
                if (!data[year][sanitisedCreatorName]) data[year][sanitisedCreatorName] = 0
                    
                data[year][sanitisedCreatorName] += 1
            }
        }
    })
    
    // make chart area
    for (let year = 2016; year <= new Date().getFullYear(); year++) {
        out += `<tr>`
        // year
        out += `<td class="tableChartLabel">${year}</td>`
        
        let record = data[""+year]
        let total = Object.values(record).reduce((a,i) => a+i, 0)
        
        out += `<td class="tableBarChartArea" style="width: 100vw">`
        Object.keys(workshopThemeCol).forEach(shop => {
            let col = workshopThemeCol[shop]
            let lum = htmlColToLum(col)
            let count = record[shop] || 0
            let percentage = count * 100.0 / total
            
            if (count > 0) {
                out += `<div class="tableBarChartStack" style="width:${percentage}%; background:${col}; color: ${(lum > 0.6215) ? "#444" : "#F9F9F9"};     height:${barHeight}px" title="${shop} (${((percentage * 10)|0) / 10}%)">`
                //out += `${count}`
                out += `<div style="display:table-cell; width:100%; height:100%; text-align:center; float:left; font-size: ${fontSize}px; padding:${padding}px 0 ${padding}px 0">${count}</div>`
                out += `</div>`
            }
        })
        out += `</td>`
        // total number
        out += `<td class="tableDataNumber" style="display: table-cell; color: #888">${total}</td>`
        
        out += `</tr>`
    }
    document.getElementById("market_share_stat_table").innerHTML = out
    
    // make legend area
    out = `<idiv style="text-align:center; font-size: 90%; margin-top: 10px; line-height: ${2*fontSize}px">`
    Object.keys(workshopThemeCol).forEach((shop, i) => {
        out += `<idiv><idiv style="font-size:120%; color:${workshopThemeCol[shop]}">&#x2588;</idiv>`
        out += `<idiv style="color:#444; margin: 0 1em 0 0.25em">&nbsp;${shop}</idiv></idiv>`
    })
    out += `</idiv>`
    
    document.getElementById("market_share_stat_table_legend").innerHTML = out
}
