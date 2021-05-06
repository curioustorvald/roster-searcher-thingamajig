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

var furdb = {}

function forEachFur(action) {
    Object.keys(furdb).filter(i => !isNaN(i)).forEach(v => action(v))
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
    
    for (let year = 2014; year <= new Date().getFullYear(); year++) {
        let count = filterFurs(prop => prop.birthday.startsWith(''+year)).length
        out += `<tr>`
        out += `<td class="tableChartLabel">${year}</td>`
        out += `<td class="tableDataNumber">${count}</td>`
        out += `<td class="tableBarChart" style="width:${count}px">&nbsp;</td>`
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
        out += `<td class="tableDataNumber">${count}</td>`
        out += `<td class="tableBarChart" style="width:${count}px">&nbsp;</td>`
        out += `</tr>`
    })
    
    document.getElementById("style_stat_table").innerHTML = out
}
