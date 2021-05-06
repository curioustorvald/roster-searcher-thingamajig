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
        populateDiyTable()
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
    
    let counts = []
    forEachFur(prop => {
        if (prop.birthday !== undefined) {
            let year = prop.birthday.substring(0,4)
            if (year) {
                if (counts[year] === undefined) counts[year] = 0
                counts[year] += 1
            }
        }
    })
    let countmax = counts.reduce((acc, i) => (i > acc) ? i : acc, 0)
    Object.keys(counts).forEach(year => {
        let count = counts[year]
        let perc = 100.0 * count / countmax
        out += `<tr>`
        out += `<td class="tableChartLabel">${year}</td>`
        out += `<td class="tableDataNumber">${count}</td>`
        out += `<td class="tableBarChartArea"><div class="tableBarChart" style="width:${0.8*perc}%">&nbsp;</div></td>`
        out += `</tr>`
    })
        
        
    document.getElementById("birthday_stat_table").innerHTML = out
}

function populateStyleStatTable() {
    let out = ''
        
    let counts = {}
    forEachFur(prop => {
        if (prop.style) {
            if (counts[prop.style] === undefined) counts[prop.style] = 0
            counts[prop.style] += 1
        }
    })
    let countmax = Object.keys(counts).reduce((acc, style) => (counts[style] > acc) ? counts[style] : acc, 0)   
    dropdownStyle.forEach(style => {
        let count = counts[style]
        let perc = 100.0 * count / countmax
        out += `<tr>`
        out += `<td class="tableChartLabel">${style.replaceAll(' ','&nbsp;')}</td>`
        out += `<td class="tableDataNumber">${count}</td>`
        out += `<td class="tableBarChartArea"><div class="tableBarChart" style="width:${0.8*perc}%">&nbsp;</div></td>`
        out += `</tr>`
    })
    
    document.getElementById("style_stat_table").innerHTML = out
}

function populateMarketshareTable() {
    let barHeight = 42
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
        
        out += `<td class="tableBarChartArea" style="width:100vw">`
        Object.keys(workshopThemeCol).forEach(shop => {
            let col = workshopThemeCol[shop]
            let lum = htmlColToLum(col)
            let count = record[shop] || 0
            let percentage = count * 100.0 / total
            
            if (count > 0) {
                out += `<tablebarchartstack style="width:${percentage}%; background:${col}; color:${(lum > 0.6215) ? "#444" : "#F9F9F9"}; height:${barHeight}px" title="${shop} (${Math.round(percentage * 10) / 10}%)">`
                out += `<stacklabel style="font-size:${fontSize}px; padding:${padding}px 0 ${padding}px 0">${count}</stacklabel>`
                out += `</tablebarchartstack>`
            }
        })
        out += `</td>`
        // total number
        out += `<td class="stackDataNumber">${total}</td>`
        
        out += `</tr>`
    }
    document.getElementById("market_share_stat_table").innerHTML = out
    
    // make legend area
    out = `<idiv style="text-align:center; font-size: 90%; margin-top: 10px; line-height: ${2*fontSize}px">`
    Object.keys(workshopThemeCol).forEach((shop, i) => {
        out += `<idiv><span style="font-size:120%; color:${workshopThemeCol[shop]}">&#x2588;</span>`
        out += `<span style="color:#444; margin: 0 1em 0 0.25em">&nbsp;${shop}</span></idiv>`
    })
    out += `</idiv>`
    
    document.getElementById("market_share_stat_table_legend").innerHTML = out
}

function populateDiyTable() {
    let barHeight = 36
    let fontSize = 14
    let padding = (barHeight - fontSize - 8) / 2
    
    
    let out = ``
    
    let diy = 0
    let bought = 0
    let partial = 0
    let full = 0
    
    forEachFur(prop => {
        if (prop.is_partial !== undefined) {
            if (prop.is_partial) partial += 1
            else full += 1
        }
        if (prop.creator_name) {
            if (prop.creator_name.includes("자작")) diy += 1
            else bought += 1
        }
    })
        
    let diyperc = 100.0 * diy / (diy + bought)
    let partialperc = 100.0 * partial / (partial + full)
    
    out += `<tr>`
    out += `<td class="tableBarChartArea" style="width:100vw">`
    out += `<tablebarchartstack style="width:${diyperc}%; background:#8AF; height:${barHeight}" title="${diy}/${diy+bought}">`
    out += `<stacklabel style="font-size:${fontSize}px; padding:${padding}px 0 ${padding}px 0">자작&nbsp;${Math.round(diyperc * 10) / 10}%</stacklabel>`
    out += `</tablebarchartstack>`
    out += `<tablebarchartstack style="width:${100 - diyperc}%; background:#FA8; height:${barHeight}" title="${bought}/${diy+bought}">`
    out += `<stacklabel style="font-size:${fontSize}px; padding:${padding}px 0 ${padding}px 0">수주&nbsp;${100 - Math.round(diyperc * 10) / 10}%</stacklabel>`
    out += `</tablebarchartstack>`
    // total number
    out += `<td class="stackDataNumber">${diy+bought}</td>`
    out += `</td>`
    out += `</tr>`
    
    out += `<tr>`
    out += `<td class="tableBarChartArea" style="width:100vw">`
    out += `<tablebarchartstack style="width:${partialperc}%; background:#ED7D31; height:${barHeight}" title="${partial}/${partial+full}">`
    out += `<stacklabel style="font-size:${fontSize}px; padding:${padding}px 0 ${padding}px 0; color:#F9F9F9">파셜&nbsp;${Math.round(partialperc * 10) / 10}%</stacklabel>`
    out += `</tablebarchartstack>`
    out += `<tablebarchartstack style="width:${100 - partialperc}%; background:#0563C1; height:${barHeight}" title="${full}/${partial+full}">`
    out += `<stacklabel style="font-size:${fontSize}px; padding:${padding}px 0 ${padding}px 0; color:#F9F9F9"">풀&nbsp;${100 - Math.round(partialperc * 10) / 10}%</stacklabel>`
    out += `</tablebarchartstack>`
    // total number
    out += `<td class="stackDataNumber">${partial+full}</td>`
    out += `</td>`
    out += `</tr>`
        
    document.getElementById("diy_stat_table").innerHTML = out
}
