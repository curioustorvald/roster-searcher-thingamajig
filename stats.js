"use strict";

const plotColset = [
/*0*/"#E41A1C","#377EB8","#4DAF4A","#984EA3","#FF7F00","#FFF000","#A65628","#F781BF","#999999",
/*9*/"#66C2A5","#FC8D62","#8DA0CB","#E78AC3","#A6D854","#FFD92F","#E5C494","#B3B3B3",
/*17*/"#8DD3C7","#FFFFB3","#BEBADA","#FB8072","#80B1D3","#FDB462","#B3DE69","#FCCDE5","#D9D9D9","#BC80BD","#CCEBC5","#FFED6F",
/*29*/"#1B9E77","#D95F02","#7570B3","#E7298A","#66A61E","#E6AB02","#A6761D","#666666"
]

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

String.prototype.unbreakable = function() {
    return this.split('').join('&NoBreak;').replaceAll(' ', '&nbsp;')
}
Array.prototype.sum = function(selector) {
    return this.reduce((acc,val) => acc + ((selector === undefined) ? val : selector(val)), 0)
}
Array.prototype.max = function(selector) {
    return this.reduce((acc,val) => (((selector === undefined) ? val : selector(val)) > acc) ? ((selector === undefined) ? val : selector(val)) : acc, 0)
}

const dropdownStyle = ["Cyber","Kemo","Kemo Toon","Toon","Semi","Real","Real Toon"]
function htmlColToLum(text) {
    let r = parseInt("0x"+text.substring(1,3)) / 255.0
    let g = parseInt("0x"+text.substring(3,5)) / 255.0
    let b = parseInt("0x"+text.substring(5,7)) / 255.0
    return Math.pow(0.299*Math.pow(r,2.2) + 0.587*Math.pow(g,2.2) + 0.114*Math.pow(b,2.2),1/2.2)
}

function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start
        start = 0
    }
    if (typeof step == 'undefined') {
        step = 1
    }
    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return []
    }
    var result = []
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i)
    }
    return result;
}

function toStrokeSize(percentage, radius) {
    let r = radius || 10.0
    let f = 2.0 * r * Math.PI
    return `${percentage * f} ${(1.0 - percentage) * f + 1}`
}

function toStrokeOffset(percentage, radius) {
    let r = radius || 10.0
    let f = 2.0 * r * Math.PI
    return `${(1.0 - percentage) * f + 1}`
}

function toMidPoint(start, end, datasetOrd, datasetSize, reverseOrd, boxsize, radius, strokeSize) {
    let r = radius || 10.0
    let d = boxsize || 30.0
    let o = d / 2
    let theta = ((start + end) / 2.0) * 2 * Math.PI
    let l = strokeSize || 10.0
    let lw = l * 0.5
    let halfl = lw / 2.0
    let realOrd = (reverseOrd) ? datasetSize - datasetOrd + 1 : datasetOrd
    let zigzagOrd = (realOrd % 2 == 0) ? realOrd / 2 : (datasetSize-1) - (realOrd-1) / 2
    let r2 = r + halfl - (zigzagOrd / datasetSize) * lw

    let x = o + r2 * Math.sin(theta)
    let y = o - r2 * Math.cos(theta)
        
    return [x,y]
}

const pieSize3 = 320

/*
dataset = {
    keys: [2014,2015,2016,...],
    values: [1,2,18,...],
    coloff: 3
}

legendType: "label", "percentage", "label+percentage"
 */
function toPieChart(height, dataset, labelType, legendType, colourset, reverseOrd) {
    let boxsize = 30
    let radius = 10
    
    let colours = colourset || plotColset
    
    let commands = []
    let commands2 = []
    
    let out = `<svg height="${height}px" width="100%" viewBox="0 0 ${boxsize} ${boxsize}" xmlns="http://www.w3.org/2000/svg">`
    out += `<style>
    .label{font-size:1.2px;font-weight:600}
    .dark{fill:#FAFAFA}
    .light{fill:#333}
</style>`
    
    let countsum = dataset.values.sum()
    let acc = 0
    
    Object.keys(dataset.keys).forEach((key,i) => {
        let count = dataset.values[i]
        
        if (count > 0) {
            let perc = count / countsum
            let colour = colours[(i+dataset.coloff)%colours.length]
            let theme = htmlColToLum(colour) > 0.5 ? "light" : "dark"
            let label = ("label+percentage" == labelType) ?
                    (dataset.keys[i] + ' ' + ((((perc * 1000)|0) / 10) + '%')) :
                ("label" == labelType) ?
                    dataset.keys[i] :
                ("percentage" == labelType) ?
                    ((((perc * 1000)|0) / 10) + '%') : ''

            commands.push(`<circle r="10" cx="15" cy="15" fill="transparent" stroke="${colour}" stroke-width="10" stroke-dasharray="${toStrokeSize(perc, radius)}" stroke-dashoffset="${toStrokeOffset(acc, radius)}" transform="rotate(-90) translate(-30)"/>`)
            
            let [tx,ty] = toMidPoint(acc, acc+perc, i, dataset.keys.length, reverseOrd, boxsize, radius)
            
            commands2.push(`<text text-anchor="middle" x="${tx}" y="${ty}" class="label ${theme}">${label}</text>`)
            
            acc += perc
        }
    })
    
    commands.reverse().forEach(s => { out += s })
    commands2.reverse().forEach(s => { out += s })
    
    out += `</svg>`
    
    // legend
    if (legendType) {
        out += `<idiv style="text-align:center; font-size: 90%; margin-top: 10px; line-height: 200%">`
        Object.keys(dataset.keys).forEach((key,i) => {
            let count = dataset.values[i]
            let perc = count / countsum
            let colour = colours[(i+dataset.coloff)%colours.length]
            let label = ("label+percentage" == legendType) ?
                    (dataset.keys[i] + ': ' + ((((perc * 1000)|0) / 10) + '%')) :
                ("label" == legendType) ?
                    dataset.keys[i] :
                ("percentage" == legendType) ?
                    ((((perc * 1000)|0) / 10) + '%') : ''

            out += `<idiv><span style="font-size:120%; color:${colour}">&#x2588;</span>`
            out += `<span style="color:#444; margin: 0 1em 0 0.25em">&nbsp;${label}</span></idiv>`
        })
        out += `</idiv>`
    }
        
    return out
}

var furdb = {}
var workshops = {}
var colourPalette = {}

function forEachFur(action) {
    Object.keys(furdb).filter(i => !isNaN(i)).forEach(v => action(furdb[v], v))
}

function mapFurs(transformation) {
    return Object.keys(furdb).filter(i => !isNaN(i)).map(v => transformation(furdb[v], v))
}

function filterFurs(predicate) {
    return Object.keys(furdb).filter(i => !isNaN(i)).filter(v => predicate(furdb[v], v))
}

function statsinit() {
    loadJSON("workshops.json", true, response => {
        workshops = JSON.parse(response)

        loadJSON("colourpalette.json", true, response => {
            colourPalette = JSON.parse(response)
            
            loadJSON("furdb.json", true, response => {
                furdb = JSON.parse(response)
                
                // must be here because db load is asynchronous        
                populateStatsText()
                populateBirthdayStatTable()
                populateStyleStatTable()
                populateMarketshareTable()
                populateDiyTable()
                populateTopTenSpecies()
                populateColourScheme()
            })
        })
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
        
    let datasetYears = []
    let datasetValues = []
    Object.keys(counts).forEach((year,i) => {
        datasetYears.push(year)
        datasetValues.push(counts[year])
    })
        
    document.getElementById("birthday_stat_table").innerHTML = toPieChart(pieSize3, {
        keys: datasetYears,
        values: datasetValues,
        coloff: 0
    }, "percentage", "label+percentage")
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
    
    let sorted = Object.entries(counts).sort((one,other) => other[1] - one[1])
        
    document.getElementById("style_stat_table").innerHTML = toPieChart(pieSize3, {
        keys: sorted.map(it => it[0]),
        values: sorted.map(it => it[1]),
        coloff: 13
    }, "label", "label+percentage", plotColset, true)
}

let marketShareDetailsShown = false

function showMarketShareDetails(key) {
    let p = key.split('¤')
    
    let year = p[0]
    let name = p[1]
        
    let rootpage = window.location.href.split('?')[0]
    while (rootpage.endsWith("/")) rootpage = rootpage.substring(0, rootpage.length - 1)
    rootpage = rootpage.substring(0, rootpage.lastIndexOf("/"))
    
    let tag = `creator_name startswith ${name} and birthday > ${year-1}9999 and birthday < ${(year*1)+1}0000`
    
    window.location.replace(`${rootpage}/index.html?tags=${tag}&showwip=true`)
}

function populateMarketshareTable() {
    let barHeight = 42
    
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
            
            if (Object.keys(workshops).includes(sanitisedCreatorName)) {
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
        let total = Object.values(record).sum()
        
        out += `<td class="tableBarChartArea" style="width:100vw">`
        Object.keys(workshops).forEach(shop => {
            let col = workshops[shop].colour
            let lum = htmlColToLum(col)
            let barclass = (lum > 0.93) ? "superlight" : (lum >= 0.675) ? "light" : "dark"
            let count = record[shop] || 0
            let percentage = count * 100.0 / total
            
            if (count > 0) {
                out += `<tablebarchartstack class="${barclass}" style="width:${percentage}%; background:${col}; height:${barHeight}px; line-height:${barHeight}px" title="${shop} (${Math.round(percentage * 10) / 10}%)" onclick="showMarketShareDetails('${year}¤${shop}')">`
                out += count
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
    out = `<idiv style="text-align:center; font-size: 90%; margin-top: 10px; line-height: 200%">`
    Object.keys(workshops).forEach((shop, i) => {
        out += `<idiv><span style="font-size:120%; color:${workshops[shop].colour}">&#x2588;</span>`
        out += `<span style="color:#444; margin: 0 1em 0 0.25em">&nbsp;${shop}</span></idiv>`
    })
    out += `</idiv>`
    
    document.getElementById("market_share_stat_table_legend").innerHTML = out
}

function populateDiyTable() {
    let barHeight = 36    
        
    let diy = 0
    let bought = 0
    let partial = 0
    let full = 0
    
    forEachFur(prop => {
        if (prop.is_partial !== "") {
            if (prop.is_partial === true) partial += 1
            else if (prop.is_partial === false) full += 1
        }
        if (prop.creator_name !== "") {
            if (prop.creator_name.includes("자작")) diy += 1
            else bought += 1
        }
    })
        
    let diyperc = diy / (diy + bought)
    let partialperc = partial / (partial + full)
    
    let diyDataset = {
        keys: ["자작","수주"],
        values: [diyperc, 1.0-diyperc],
        coloff: 22
    }
    
    let fullsuitDataset = {
        keys: ["파셜","풀"],
        values: [partialperc, 1.0-partialperc],
        coloff: 26
    }
    
    let out1 = `<div class="flex_halfcol">${toPieChart(pieSize3, diyDataset, "label+percentage", "")}</div>`
    
    let out2 = `<div class="flex_halfcol">${toPieChart(pieSize3, fullsuitDataset, "label+percentage", "")}</div>`
        
    document.getElementById("diy_stat_table").innerHTML = `<tr><td>${out1}</td><td>${out2}</td></tr>`
}

function populateTopTenSpecies() {
    const showCount = 10
    let records = {}
    let unknowns = 0
    forEachFur(prop => {
        if (prop.species_ko.length > 0) {
            prop.species_ko.forEach(tok => {
                if (records[tok] === undefined)
                    records[tok] = 0
                    
                records[tok] += 1
            })
        }
        else
            unknowns += 1
    })
    
    let sorted = Object.entries(records).sort((one,other) => other[1] - one[1]).slice(0, showCount)
        
    document.getElementById("top_ten_species_table").innerHTML = toPieChart(pieSize3, {
        keys: sorted.map(it => it[0]),
        values: sorted.map(it => it[1]),
        coloff: 8
    }, "label", "label+percentage", plotColset, true)
}

function populateColourScheme() {
    let barHeight = 42
    
    let bgstat = {}
    let hairstat = {}
    let eyestat = {}
    
    // init data
    Object.keys(colourPalette).forEach(c => { bgstat[c] = 0; hairstat[c] = 0; eyestat[c] = 0 })
    // gather data
    forEachFur(prop => {
        if (prop.colour_combi.length > 0) {
            prop.colour_combi.forEach(col => {
                if (col in bgstat) bgstat[col] += 1
            })
        }
        if (prop.hair_colours.length > 0) {
            prop.hair_colours.forEach(col => {
                if (col in hairstat) hairstat[col] += 1
            })
        }
        if (prop.eye_colours.length > 0) {
            prop.eye_colours.forEach(col => {
                if (col in eyestat) eyestat[col] += 1
            })
        }
    })
            
    let cmds = {
        "색상 조합": {data:bgstat, id:"colour_scheme_table"},
        "머리카락": {data:hairstat, id:"hair_colours_table"},
        "눈 색상": {data:eyestat, id:"eye_colours_table"}
    }
    
    Object.keys(cmds).forEach(title => {
        let out = toPieChart(pieSize3, {
            keys: Object.keys(colourPalette),
            values: Object.values(cmds[title].data),
            coloff: 0
        }, "", "label+percentage", Object.values(colourPalette).map(it => it[0]).slice(0, 16).concat(["#FBFBFC"]))
        
        
        document.getElementById(cmds[title].id).innerHTML = out
    })
}
