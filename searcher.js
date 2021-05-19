"use strict";

const dropdownIdToDBname = {
    "literal_dog":["개"],
    "literal_wolf":["늑대"],
    "literal_cat":["고양이"],
    "group_felidae":["고양이과","고양잇과","사자","호랑이","표범","카라칼","퓨마","쿠거","마운틴라이언","치타","팬서"],
    "literal_fox":["여우"],
    "literal_rabbit":["토끼"],
    "group_aves":["조류","새","앵무","수리","올빼미","부엉이","까마귀","독수리","물까치","까치"],
    "group_pisces":["어류","물고기","잉어","상어","고래"],
    "literal_dragon":["드래곤"],
    "literal_deer":["노루/사슴","사슴","노루"],
    "group_raccoons":["레서판다/라쿤/너구리","레서판다","라쿤","너구리"],
    "literal_bear":["곰"],
    "group_rodentia":["설치류","다람쥐","청설모","날다람쥐","쥐"],
    "group_mustelidae":["족제비과","오소리","족제비"],
    "group_bovidae":["소/양","소","염소","양","젖소"],
    "group_camelidae":["낙타/알파카/라마","낙타","알파카","라마"],
    "literal_bat":["박쥐"],
    "literal_fantasy_sergal":["세르갈"],
    "literal_fantasy_protogen":["프로토겐"],
    "literal_fantasy_henelsia":["헤넬시아","나비 고양이"]
}

const dropdownStyle = ["Cyber","Kemo","Kemo Toon","Toon","Semi","Real","Real Toon"]

// 외부 JSON 가져오기
// Localhost에서 작동시킬 시 보안 문제로 로딩 안될 수 있음. 보안 설정을 잠깐 끄거나 서버에 올려서 돌리시오.
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

var lang = "ko"
var furdb = {}
var creatorThesaurus = {}
var colourPalette = {}
var workshops = {}

function htmlColToLum(text) {
    if (!text) return 0.5
    let r = parseInt("0x"+text.substring(1,3)) / 255.0
    let g = parseInt("0x"+text.substring(3,5)) / 255.0
    let b = parseInt("0x"+text.substring(5,7)) / 255.0
    return (3*r + 4*g + b) / 8.0
}

function forEachFur(action) {
    Object.keys(furdb).filter(i => !isNaN(i)).forEach(v => action(furdb[v], v))
}

function mapFurs(transformation) {
    return Object.keys(furdb).filter(i => !isNaN(i)).map(v => transformation(furdb[v], v))
}

// return: ids of furs
function filterFurs(predicate) {
    return Object.keys(furdb).filter(i => !isNaN(i)).filter(v => predicate(furdb[v], v))
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

const tagDocumentation = {
    "creator_name":{"ko":"퍼슈트의 제작자를 나타냅니다. 자작 퍼슈트의 경우 '자작'을 사용하십시오","en":"Creator of the fursuit. Use 'DIY' for DIY suits"},
    "name":{"ko":"퍼슈트 캐릭터의 이름 (한/영)","en":"Name of the character in Korean/English"},
    "actor_name":{"ko":"퍼슈트 오너의 이름 (한국어)","en":"Name of the actor in Korean"},
    "species_ko":{"ko":"퍼슈트 캐릭터의 종 (한국어)","en":"Species of the character in Korean"},
    "style":{"ko":"퍼슈트 캐릭터의 스타일 (Real, Real Toon, Kemo, Kemo Toon, Semi)","en":"Style of the character (Real, Real Toon, Kemo, Kemo Toon, Semi)"},
    "is_partial":{"ko":"캐릭터가 파셜인지 여부 (TRUE, FALSE)","en":"If the suit is partial-suit (TRUE, FALSE)"},
    "country":{"ko":"오너의 국적 (ISO 3166-1 Alpha-3 코드)","en":"Nationality of the actor in ISO 3166-1 Alpha-3 Code"},
    "birthday_from":{"ko":"활동개시일 검색에서 가장 이른 날짜. 해당 날짜를 포함함 (yyyymmdd)","en":"Earliest day in birthday search, inclusive (yyyymmdd)"},
    "birthday_to":{"ko":"활동개시일 검색에서 가장 늦은 날짜. 해당 날짜를 포함함 (yyyymmdd)","en":"Latest day in birthday search, inclusive (yyyymmdd)"}
}

const i18n = {
    "ko": {
        "TagSyntaxError": "태그가 올바르지 않게 입력되었습니다: ",
        "TagGuide": "태그 가이드",
        "SearchTags": "검색어: ",
        "IsExactMatch": "검색어 정확히 매칭",
        "IsIncludeWip": "미완성 퍼슈트 포함",
        "Submit": "검색",
        "Reset": "초기화",
        "WillShowAllOnEmptySearch": "입력 칸을 비우고 검색하면 모든 퍼슈트를 보여줍니다",
        "ReplaceSpaceWithUnderscore": "공백은 언더스코어( _ )를 사용해 입력해 주십시오",
        "AdvancedSearch": "태그 검색",
        "SimpleSearch": "쉬운 검색",
        "SimpleSearchActor": "소유자: ",
        "SimpleSearchCreator": "제작자: ",
        "SimpleSearchName": "이름 (한/영): ",
        "SimpleSearchBirthday": "활동개시일: ",
        "SimpleSearchBirthday2": "활동개시일: ",
        "SimpleSearchSpecies": "종: ",
        "SimpleSearchStyle": "스타일: ",
        "SimpleSearchIsFullSuit": "풀슈트: ",
        "SimpleSearchColourCombi": "색상 조합: ",
        "SimpleSearchEyesSclera": "역안?",
        "SimpleSearchEyesColour": "홍채",
        "SimpleSearchHairColour": "염색",
        "SimpleSearchHairStreak": "브릿지",
        "SimpleSearchEyes": "눈 색깔: ",
        "SimpleSearchEyeFeatures": "눈 특징: ",
        "SimpleSearchHair": "머리카락:",
        "MadeBy": "&#x2702;&#xFE0F;&nbsp;", // BLACK SCISSORS+VARIATION SELECTOR-16 because unicode is stupid
        "ThisManySearchResults": template`${0}개의 검색 결과:`,
        "None": "없음",
        "Any": "아무거나",
        "SimpleSearchColourTable": "색도표",
        "SimpleSearchFromPre": "",
        "SimpleSearchFromPost": "부터",
        "SimpleSearchToPre": "",
        "SimpleSearchToPost": "까지",
        "ConditionYes": "예",
        "ConditionNo": "아니오",
        "ShareLink": "공유 주소: ",
        "ClickToCopyLink": "(눌러서 링크 복사)",
        "LinkCopied": "링크가 복사되었습니다",
        "TagParserError": "태그에 문법 오류가 있습니다:"
    },
    "en": {
        "TagSyntaxError": "Entered tag is malformed: ",
        "TagGuide": "Tag Guides",
        "SearchTags": "Search Tags: ",
        "IsExactMatch": "Exact Match?",
        "IsIncludeWip": "Include Not Yet Completed?",
        "Submit": "Submit",
        "Reset": "Reset",
        "WillShowAllOnEmptySearch": "Searching with no criteria will show all fursuits",
        "ReplaceSpaceWithUnderscore": "Use underscore ( _ ) to type in spaces",
        "AdvancedSearch": "Search By Tags",
        "SimpleSearch": "Easy Search",
        "SimpleSearchActor": "Owner: ",
        "SimpleSearchCreator": "Creator: ",
        "SimpleSearchName": "Name (Korean/English): ",
        "SimpleSearchBirthday": "Day of Birth: ",
        "SimpleSearchBirthday2": "Day of Birth: ",
        "SimpleSearchSpecies": "Species: ",
        "SimpleSearchStyle": "Style: ",
        "SimpleSearchIsFullSuit": "Full Suit? ",
        "SimpleSearchColourCombi": "Colour Schemes: ",
        "SimpleSearchEyesSclera": "Sclera",
        "SimpleSearchEyesColour": "Iris",
        "SimpleSearchHairColour": "Dye",
        "SimpleSearchHairStreak": "Streak",
        "SimpleSearchEyes": "Eye Colour: ",
        "SimpleSearchEyeFeatures": "Eye Features: ",
        "SimpleSearchHair": "Hair Colour: ",
        "MadeBy": "&#x2702;&#xFE0F;&nbsp;", // BLACK SCISSORS+VARIATION SELECTOR-16 because unicode is stupid
        "ThisManySearchResults": template`Showing ${0} search results:`,
        "None": "None",
        "Any": "Any",
        "SimpleSearchColourTable": "Colour Table",
        "SimpleSearchFromPre": "From",
        "SimpleSearchFromPost": "",
        "SimpleSearchToPre": "&nbsp;&nbsp;To",
        "SimpleSearchToPost": "",
        "ConditionYes": "Yes",
        "ConditionNo": "No",
        "ShareLink": "Share Link: ",
        "ClickToCopyLink": "(Click to Copy the Link)",
        "LinkCopied": "Link Copied",
        "TagParserError": "Parsing Error on the tags:"
    }
}

const openqot = "&#x2018;"
const closeqot = "&#x2019;"
const openqot2 = "&#x201C;"
const closeqot2 = "&#x201D;"

const tagdocrow = template`<tr><td class="tagdoc1">${0}</td><td class="tagdoc2">${1}</td></tr>`

const tagdoc = {
    "ko":`
<p style="color: #111">전방 위험지대! 태그 검색은 고급 사용자를 위한 기능입니다. 아래의 설명서를 이해할 자신이 없다면 ${openqot}쉬운 검색${closeqot}을 사용해 주십시오!</p>
    
<h4>문법</h4>
<codeblock>
(* EBNF 일러두기 *)<br>
(* { 단어 } = 괄호 안 내용물이 0회 이상 반복됨을 나타냄 *)<br>
(* 구문 - "문자" = 특정 문자가 빠진 구문 *)<br>
<br>
수식 = "(" , 수식 , ")"<br>
 &nbsp; &nbsp; | "'" , 문자열 , "'"<br>
 &nbsp; &nbsp; | 검색조건<br>
 &nbsp; &nbsp; | 수<br>
 &nbsp; &nbsp; | 수식 , 연산자 , 수식 ;<br>
<br>
문자열 = ? 연산자와 충돌하지 않는 적절한 문자의 집합 ? ;<br>
<br>
연산자 = "," | "<" | ">" | "<=" | "=<" | ">=" | "=>" | "IS" | "ISNOT" | "ISONEOF" | "ISNONEOF" | "HASALLOF" | "HASSOMEOf" | "HASNONEOF" | "STARTSWITH" | "NOTSTARTSWITH" | "AND" | "OR" ;<br>
<br>
수 = 숫자 - "0" , { 숫자 } ;<br>
<br>
숫자 = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
</codeblock>

<div style="display:flex; flex-flow: row wrap;">
<div class="flex_halfcol" style="min-width: 300px">
<h4>연산자</h4>
<table class="tagdoctable">
${tagdocrow(`IS`,`좌변과 우변이 일치함`)}
${tagdocrow(`ISNOT`,`좌변과 우변이 일치하지 않음`)}
${tagdocrow(`ISONEOF`,`우변에 좌변의 일부가 포함되어 있음`)}
${tagdocrow(`ISNONEOF`,`우변에 좌변의 일부가 포함되어 있지 않음`)}
${tagdocrow(`HASALLOF`,`좌변에 우변의 전체가 포함되어 있음`)}
${tagdocrow(`HASSOMEOF`,`좌변에 우변의 일부가 포함되어 있음`)}
${tagdocrow(`HASNONEOF`,`좌변에 우변의 전체가 포함되어 있지 않음`)}
${tagdocrow(`STARTSWITH`,`좌변이 우변의 문자열로 시작함`)}
${tagdocrow(`NOTSTARTSWITH`,`좌변이 우변의 문자열로 시작하지 않음`)}
${tagdocrow(`&gt;= &middot; =&gt;`,`좌변이 우변에 비해 크거나 같음`)}
${tagdocrow(`&lt;= &middot; =&lt;`,`좌변이 우변에 비해 작거나 같음`)}
${tagdocrow(`&gt;`,`좌변이 우변에 비해 더 큼`)}
${tagdocrow(`&lt;`,`좌변이 우변에 비해 더 작음`)}
${tagdocrow(`,`,`두 개 이상의 검색어를 모아 배열을 만듦`)}
${tagdocrow(`AND`,`좌변과 우변의 조건이 모두 일치함`)}
${tagdocrow(`OR`,`좌변과 우변의 조건이 한 개 이상 일치함`)}
</table>
</div>
<div class="flex_halfcol" style="min-width: 300px">
<h4>검색 조건</h4>
<table class="tagdoctable">
${tagdocrow(`name_ko`,`캐릭터의 이름 (한)`)}
${tagdocrow(`name_en`,`캐릭터의 이름 (영)`)}
${tagdocrow(`name_ja`,`캐릭터의 이름 (일)`)}
${tagdocrow(`creator_name`,`제작자의 이름`)}
${tagdocrow(`creator_link`,`제작자의 트위터 주소`)}
${tagdocrow(`actor_name`,`소유자의 이름`)}
${tagdocrow(`actor_link`,`소유자의 트위터 주소`)}
${tagdocrow(`birthday`,`yyyymmdd 꼴로 입력한 생일 (예: 2020년 2월 8일 → <code>20200208</code>)`)}
${tagdocrow(`species_ko`,`캐릭터의 종 (한국어)`)}
${tagdocrow(`style`,`캐릭터의 스타일`)}
${tagdocrow(`is_partial`,`파셜 여부 (<code>true</code> 혹은 <code>false</code>)`)}
${tagdocrow(`is_34partial`,`준풀슈트(풀슈트에서 상체 혹은 하체가 없는 것) 여부 (<code>true</code> 혹은 <code>false</code>)`)}
${tagdocrow(`colour_combi`,`바디와 헤드의 색상 조합`)}
${tagdocrow(`hair_colours`,`머리카락 색상`)}
${tagdocrow(`eye_colours`,`눈 색깔`)}
${tagdocrow(`eye_features`,`눈 특징 (<code>역안</code>, <code>무늬</code>)`)}
</table>
</div>
</div>
<p>
&bullet; 검색어는 대소문자를 구분하지 않습니다.<br>
&bullet; 각 항은 괄호로 감쌀 수 있습니다. (예: <code>(creator_name is 블루폭스 or creator_name is 아토아마) and species_ko is 고양이</code>)<br>
&bullet; 공백이 포함된 이름은 작은따옴표로 감쌀 수 있습니다. (예: <code>creator_name is '공백이 포함된 이름!'</code>)</p>
`,

    "en":`
<p style="color: #111">Here be Dragons! Tag Search is made for advanced users. If you have no confidence understanding the fine manual below, please be kind to yourself and use ${openqot}Easy Search${closeqot} instead!</p>

<h4>TODO</h4>
`
}

const nulsel = `<option value="dont_care">&mdash;</option>`
function nonesel() {
    return `<option value="none">${i18n[lang].None}</option>`
}
function anysel() {
    return `<option value="any">${i18n[lang].Any}</option>`
}

// haskell-inspired array functions
Array.prototype.head = function() {
    return this[0]
}
Array.prototype.last = function() {
    return this[this.length - 1]
}
Array.prototype.tail = function() {
    return this.slice(1)
}
Array.prototype.init = function() {
    return this.slice(0, this.length - 1)
}

function pageinit() {
    // DB 로드
    loadJSON("workshopaliases.json", true, response => {
        creatorThesaurus = JSON.parse(response)
        
        loadJSON("colourpalette.json", true, response => {
            colourPalette = JSON.parse(response)
            
            loadJSON("workshops.json", true, response => {
                workshops = JSON.parse(response)
            
                loadJSON("furdb.json", true, response => {
                    furdb = JSON.parse(response)
                    
                    checkForDatabaseErrors()
                    
                    
                    // handle the 'show' query string
                    // qd is defined on index.html
                    if (qd.show !== undefined) {
                        showOverlay(qd.show[0])
                    }
                    // handle the 'tags' query string
                    if (qd.tags !== undefined) {
                        let showwip = (qd.showwip && qd.showwip[0] == "true")
                        makeOutput(performTagSearch(qd.tags[0], showwip))
                    }
                    
                    // jobs that need DB to be there
                    //populateEyesSelection()
                    populateColourChooser("eye_colours")
                    populateColourChooser("body_colours")
                    populateColourChooser("hair_colours")
                    populateEyeFeaturesChooser()
                    //populateColourSelection()
                    //populateHairSelection()
                    // these are here to just make them pop up in sync with more heavy tasks
                    populateSpeciesSelection()
                    populateStyleSelection()
                })
            })
        })
        
    })
    // 선택된 언어로 문서 출력
    reloadI18n()
    
    clearResults()
}

function checkForDatabaseErrors() {
    let msg = []
    let outdatedSpeciesFormatWarned = false
    
    forEachFur((prop, id) => {
        prop.colour_combi.forEach(col => {
            if (!(col in colourPalette)) msg.push(`Undefined colour_combi '${col}' for id ${id}`)
        })
        prop.hair_colours.forEach(col => {
            if (!(col in colourPalette)) msg.push(`Undefined hair_colours '${col}' for id ${id}`)
        })
        prop.eye_colours.forEach(col => {
            if (!(col in colourPalette)) msg.push(`Undefined eye_colours '${col}' for id ${id}`)
        })
        prop.eye_features.forEach(feature => {
            if (!(feature in specialEyeSwatch)) msg.push(`Undefined eye_colours '${col}' for id ${id}`)
        })
        
        let creator = prop.creator_name.split('/')[0]
        if (workshops[creator] != undefined) {    
            let twitterFromWorkshops = workshops[creator].twitter.toLowerCase()
            let twitterFromProp = prop.creator_link.split('/').pop().toLowerCase()
            
            if (twitterFromWorkshops != twitterFromProp) {
                msg.push(`'${prop.creator_name}' != '${prop.creator_link}' for id ${id}`)
            }
        }
        
        if (!outdatedSpeciesFormatWarned && !Array.isArray(prop.species_ko)) {
            outdatedSpeciesFormatWarned = true
            msg.push(`Species_ko is NOT an array; please re-build the database.`)
        }
    })
        
    if (msg.length > 0) {
        let msgstr = msg.join('\n')
        alert(`데이터베이스의 무결성 검증에 실패하였습니다:\n${msgstr}`)
        throw Error(msgstr)
    }
}

function createColourSwatch(name) {
    if (name.length == 0) return ``
            
    let colour = colourPalette[name][0]
    if (!colour) colour = colourPalette[name][0]
            
    let lum = htmlColToLum(colour)
    let subclass = (lum >= 0.675) ? "light" : "dark"
    return `<span class="checkmark swatch" luminosity="${subclass}" style="background:${(colour.startsWith('#') ? colour : `var(--${colour})`)}" title="${name}"></span>`
}

const specialEyeSwatch = {
    "역안":`<span class="checkmark swatch swatch_black_sclera" luminosity="light" title="역안"></span>`,
    "무늬":`<span class="checkmark swatch swatch_shaped_pupil" luminosity="dark" title="무늬"></span>`
}

function populateColourChooser(parentname) {
    // expected parentname: "body_colours", "hair_colours"
    let out = ``
    
    Object.keys(colourPalette).forEach(name => {
        if (name != "무지개색") {
            out += `<label class="container">&zwj;`
            out += `<input type="checkbox" id="${parentname}_${name}">`
            out += createColourSwatch(name)
            out += `</label>`
        }
    })
    
    document.getElementById(`simplesearch_${parentname}`).innerHTML = out
}

function populateEyeFeaturesChooser() {
    let out = ``
    
    Object.entries(specialEyeSwatch).forEach(kv => {        
        out += `<label class="container">${kv[0]}`
        out += `<input type="checkbox" id="eye_features_${kv[0]}">`
        out += kv[1]
        out += `</label>`
    })
    
    document.getElementById(`simplesearch_eye_features`).innerHTML = out
}

function populateColourPaletteHelpMessage() {
    let maxSwatchCount = Object.values(colourPalette).reduce((acc,arr) => (arr.length > acc) ? arr.length : acc, 0)
    
    let out = `<table><thead style="text-align:center"><tr><td style=" border-bottom:1px solid #AAA;" colspan="${maxSwatchCount + 2}" ><h4>${i18n[lang].SimpleSearchColourTable}</h4></td></tr><tr><td colspan="${maxSwatchCount + 2}" ></td></tr></thead><tbody>`
 
    Object.entries(colourPalette).forEach(kv => {
        out += `<tr>`
        out += `<td class="tableFormLabel">${kv[0]}</td>`
        
        /*out += `<td>`
        kv[1].forEach(c => {
            if (c.startsWith("#"))
                out += `<span style="font-size:120%; color:${c}">&#x2588;&nbsp;</span>`
            else
                out += `<${c}></${c}>`
        })
        out += `</td>`*/
        kv[1].forEach(c => {
            if (c.startsWith("#")) {
                out += `<td class="colour_swatch" style="background:${c}">&nbsp;</td>`
            }
            else {
                out += `<td colspan="${maxSwatchCount}" class="${c}">&nbsp;</td>`
            }
        })
        
        out += `</tr>`
    })
 
    out += `</tbody></table>`
 
    document.getElementById("colour_palette_showoff").innerHTML = out
}

function populateSpeciesSelection() {
    let output = `${nulsel}`
    Object.keys(dropdownIdToDBname).forEach(key => {
        output += `<option value="${key}">`
        output += dropdownIdToDBname[key][0]//.join('/')
        output += `</option>`
    })
    document.getElementById("simplesearch_dropdown_species").innerHTML = output
}

function populateStyleSelection() {
    let output = `${nulsel}`
    dropdownStyle.forEach(value => {
        output += `<option value="${value}">`
        output += value
        output += `</option>`
    })
    document.getElementById("simplesearch_input_style").innerHTML = output
}


// code for the old dropdown menu which is unused
function populateColourSelection() {
    let bgCols = {} // for colours that appear on the sheet but not in the colour palette
    let fgCols = {} // for colours that appear on the sheet but not in the colour palette
    
    forEachFur(prop => {
        let colours = prop.colours
        if (colours.length > 0) {
            if (!bgCols[colours[0]])
                bgCols[colours[0]] = 1
            for (let i = 1; i < colours.length; i++) {
                if (!fgCols[colours[i]])
                    fgCols[colours[i]] = 1
            }
        }
    })
        
    let bgColList = Object.keys(bgCols).sort().filter(it => !(it in colourPalette))
    let fgColList = Object.keys(fgCols).sort().filter(it => !(it in colourPalette))
    
    let commonSel = nulsel + Object.keys(colourPalette).map(s => `<option value="${s}">${s}</option>`).join('')
    
    let bgSel = `${commonSel}`
    if (bgColList.length > 0) bgSel += nulsel + bgColList.map(s => `<option value="${s}">${s}</option>`).join('')
        
    let fgSel = `${commonSel}`
    if (fgColList.length > 0) fgSel += nulsel + fgColList.map(s => `<option value="${s}">${s}</option>`).join('')
    
    document.getElementById("simplesearch_colour_background").innerHTML = bgSel
    document.getElementById("simplesearch_colour1").innerHTML = fgSel
    document.getElementById("simplesearch_colour2").innerHTML = fgSel
    document.getElementById("simplesearch_colour3").innerHTML = fgSel
}

// code for the old dropdown menu which is unused
function populateEyesSelection() {
    let cols = {}
    
    forEachFur(prop => {
        let colours = prop.eyes
        colours.forEach(col => {
            if (!cols[col] && col != "역안")
                cols[col] = 1
        })
    })
        
    let colList = Object.keys(cols).sort()
    let scleraList = ["역안"]
    
    let colSel = nulsel + colList.map(s => `<option value="${s}">${s}</option>`).join('')
    let sclearSel = nulsel + scleraList.map(s => `<option value="${s}">${s}</option>`).join('')
    
    document.getElementById("simplesearch_eyes").innerHTML = colSel
    document.getElementById("simplesearch_eyes_sclera").innerHTML = sclearSel
}

// code for the old dropdown menu which is unused
function populateHairSelection() {
    let bgCols = {}
    let fgCols = {}
    
    forEachFur(prop => {
        let colours = prop.hairs
        if (colours.length > 0) {
            if (!bgCols[colours[0]])
                bgCols[colours[0]] = 1
            for (let i = 1; i < colours.length; i++) {
                if (!fgCols[colours[i]])
                    fgCols[colours[i]] = 1
            }
        }
    })
        
    let bgColList = Object.keys(bgCols).sort()
    let fgColList = Object.keys(fgCols).sort()
    
    let bgSel = nulsel + nonesel() + anysel() + bgColList.map(s => `<option value="${s}">${s}</option>`).join('')
    let fgSel = nulsel + nonesel() + anysel() + fgColList.map(s => `<option value="${s}">${s}</option>`).join('')
    
    document.getElementById("simplesearch_hair_dye").innerHTML = bgSel
    document.getElementById("simplesearch_hair_streak").innerHTML = fgSel
}

function reloadI18n() {
    // is full suit yes/no
    document.getElementById("simplesearch_input_is_full_suit").innerHTML = nulsel +
        `<option value="true">${i18n[lang].ConditionYes}</option>` +
        `<option value="false">${i18n[lang].ConditionNo}</option>`
    
    
    document.getElementById("will_show_anything_string").innerHTML = i18n[lang].WillShowAllOnEmptySearch
    document.getElementById("tagsearch_willshowall_string").innerHTML = i18n[lang].WillShowAllOnEmptySearch
    
    
    document.getElementById("tagdoc").innerHTML = tagdoc[lang]
    document.getElementById("tagdoc_header").innerHTML = i18n[lang].TagGuide
    
    // 검색폼 다국어화
    document.getElementById("simplesearch_header").innerHTML = i18n[lang].SimpleSearch
    document.getElementById("simplesearch_input_creatorname_string").innerHTML = i18n[lang].SimpleSearchCreator
    document.getElementById("simplesearch_input_furname_string").innerHTML = i18n[lang].SimpleSearchName
    document.getElementById("simplesearch_input_actorname_string").innerHTML = i18n[lang].SimpleSearchActor
    document.getElementById("simplesearch_input_bday_title_string").innerHTML = i18n[lang].SimpleSearchBirthday
     
    document.getElementById("bday_from_pre").innerHTML = i18n[lang].SimpleSearchFromPre
    document.getElementById("bday_from_post").innerHTML = i18n[lang].SimpleSearchFromPost
    document.getElementById("bday_to_pre").innerHTML = i18n[lang].SimpleSearchToPre
    document.getElementById("bday_to_post").innerHTML = i18n[lang].SimpleSearchToPost

    document.getElementById("simplesearch_dropdown_species_string").innerHTML = i18n[lang].SimpleSearchSpecies
    document.getElementById("simplesearch_input_is_full_suit_string").innerHTML = i18n[lang].SimpleSearchIsFullSuit
    document.getElementById("simplesearch_input_style_string").innerHTML = i18n[lang].SimpleSearchStyle
    document.getElementById("simple_submit_button").setAttribute("value", i18n[lang].Submit)
    document.getElementById("simple_reset_button").setAttribute("value", i18n[lang].Reset)
    
    document.getElementById("simplesearch_colour_string").innerHTML = i18n[lang].SimpleSearchColourCombi
    
    document.getElementById("simplesearch_input_eyes_string").innerHTML = i18n[lang].SimpleSearchEyes
    
    document.getElementById("simplesearch_input_hair_string").innerHTML = i18n[lang].SimpleSearchHair

    document.getElementById("simplesearch_input_eye_features_string").innerHTML = i18n[lang].SimpleSearchEyeFeatures

    
    //document.getElementById("searchform_header").innerHTML = i18n[lang].AdvancedSearch
    document.getElementById("searchtags_string").innerHTML = i18n[lang].SearchTags
    //document.getElementById("exactmatch_string").innerHTML = i18n[lang].IsExactMatch
    document.getElementById("includewip_string").innerHTML = i18n[lang].IsIncludeWip
    document.getElementById("includewip_string2").innerHTML = i18n[lang].IsIncludeWip
    document.getElementById("submit_button").setAttribute("value", i18n[lang].Submit)
}

function setLangKo() {
    lang = "ko"
    reloadI18n()
}
function setLangEn() {
    lang = "en"
    reloadI18n()
}
function textOrQos(s) {
    return (s.trim().length === 0) ? "???" : s
}
function obtainShareLink(id) {
    return `${window.location.href.split('?')[0]}?show=${id}`
}
function copySharelink(id) {
    let holder = document.getElementById("clipboard_dummy_container")
    holder.style.display = "block"
    holder.style.opacity = 0
    
    try {
        let temp = document.getElementById("clipboard_dummy")
        temp.value = obtainShareLink(id)
        temp.select()
        temp.setSelectionRange(0,99999)
        document.execCommand("copy")
     
        alert(i18n[lang].LinkCopied)
    }
    catch (e) {
        // just in case...
    }
    finally {
        holder.style.display = "none" // because this inputbox must be hidden
    }
}
function showOverlay(id) {    
    let prop = furdb[id]
        
    let displayFurNameKo = (prop.name_ko).trim()
    let displayFurNameEn = (prop.name_en).trim()
    let displayFurNameJa = (prop.name_ja).trim()
    let nameUnknown = (displayFurNameKo+displayFurNameEn+displayFurNameJa).length == 0
                        
    let furAliases = (prop.aliases).trim()
                        
    let actorName = (prop.actor_name).trim()
                        
    let displayActorName = textOrQos(actorName.split("/").shift())
    let displayCreatorName = textOrQos((prop.creator_name).trim().replace("/자작", ""))
    if (displayCreatorName == "자작") displayCreatorName = displayActorName
                        
    let displayActorLinkHref = (prop.actor_link.includes(":") ? "" : "@") + prop.actor_link
    if (displayActorLinkHref == "@") displayActorLinkHref = ""
                        
    let displayActorLinkName = (displayActorLinkHref == "") ? "" : ("@" + displayActorLinkHref.split("/").pop())
                        
                        
    let displayCreatorLinkHref = prop.creator_link
    let displayCreatorLinkName = (displayCreatorLinkHref == "") ? "" : ((displayCreatorLinkHref.startsWith("https://twitter.com/")) ? `@${displayCreatorLinkHref.split("/").pop()}` : `(링크)`)
    
    let tdtemplate = template`<tr><td class="tableFormLabel" style="color:#888">${0}</td><td>${1}</td></tr>`
    let tdtemplCol = template`<tr><td class="tableFormLabel" style="color:#888">${0}</td><td><colourchooser style="height:var(--colour-swatch-size-outer)">${1}</colourchooser></td></tr>`
    let tdtemplCol2 = template`<tr><td class="tableFormLabel" style="color:#888">${0}</td><td><colourchooser id="details_eye" style="height:var(--colour-swatch-size-outer)">${1}</colourchooser></td></tr>`
    
    let output = `<dummycentre><bigfurbox>`
        
    let actorLinkFull = `<a href="${displayActorLinkHref}" target="_blank" rel="noopener noreferrer">${displayActorLinkName}</a>`
    let creatorLinkFull = (prop.creator_name == "자작") ? actorLinkFull : `<a href="${displayCreatorLinkHref}" target="_blank" rel="noopener noreferrer">${displayCreatorLinkName}</a>`
    
    output += `<imgbox>`
    
    if (prop.photo)
        output += `<img src="${prop.photo}" />`
    else
        output += `<img src="no-image-available.png" />`
    
    if (prop.photo_copying)
        output += `<copying>${prop.photo_copying}</copying>`
    
    let colourCombiPal = prop.colour_combi.map(it => `<label class="container">&zwj;${createColourSwatch(it)}</label>`).join('')
    
    let hairColourPal = prop.hair_colours.map(it => `<label class="container">&zwj;${createColourSwatch(it)}</label>`).join('')
    
    let eyeColourPal = prop.eye_colours.map(it => `<label class="container">&zwj;${createColourSwatch(it)}</label>`).join('') +
            prop.eye_features.map(it => `<label class="container">&zwj;${specialEyeSwatch[it]}</label>`).join('')
    
    let copyableLinkHtml = `<span class="underline_on_hover" onclick=copySharelink(${id})>${i18n[lang].ClickToCopyLink}</span>` 
    
    output += `</imgbox>`
    
    output += `<parbox>`
    output += `<refsheetflexwrapper>`
        
        output += `<refselem1>`
        output += `<table>`
        output += `<thead><tr><th colspan="2">`
        output += `<h4>`
        if (nameUnknown) output += `<span class="name_ezselect">???</span>`
        if (displayFurNameKo.length > 0) output += `<span class="name_ezselect">${displayFurNameKo}</span>`
        if (displayFurNameEn.length > 0) output += `<span class="name_ezselect">${displayFurNameEn}</span>`
        if (displayFurNameJa.length > 0) output += `<span class="name_ezselect">${displayFurNameJa}</span>`
        output += `</h4>`
        if (furAliases.length > 0)
            output += `<h5>${furAliases.replaceAll('/', '<br />')}</h5>`
        output += `</th></tr></thead>`
        output += tdtemplate(i18n[lang].SimpleSearchSpecies, prop.species_ko)
        output += tdtemplate(i18n[lang].SimpleSearchStyle, prop.style.replaceAll('?',''))
        output += tdtemplate(i18n[lang].SimpleSearchActor, displayActorName + `&nbsp; ${actorLinkFull}`)
        output += tdtemplate(i18n[lang].SimpleSearchCreator, displayCreatorName + `&nbsp; ${creatorLinkFull}`)
        output += tdtemplate(i18n[lang].SimpleSearchBirthday2, prop.birthday)
        output += tdtemplate(i18n[lang].SimpleSearchIsFullSuit, prop.is_34partial ? "&frac34;" : !prop.is_partial ? i18n[lang].ConditionYes : i18n[lang].ConditionNo)
        
        if (colourCombiPal.length > 0)
        output += tdtemplCol(i18n[lang].SimpleSearchColourCombi, colourCombiPal)
        
        if (hairColourPal.length > 0)
        output += tdtemplCol(i18n[lang].SimpleSearchHair, hairColourPal)
        
        if (eyeColourPal.length > 0)
        output += tdtemplCol2(i18n[lang].SimpleSearchEyes, eyeColourPal)
        
        output += tdtemplate(i18n[lang].ShareLink, copyableLinkHtml)

        output += `</table>`
        
        output += `</refselem1>`
        
        if (prop.ref_sheet) {
            output += `<img class="refsElem2" src="${prop.ref_sheet}" />`
            if (prop.ref_sheet_copying)
                output += `<copying>${prop.ref_sheet_copying}</copying>`
        }
        else
            output += `<p style="color:#AAA; text-align:center">(레퍼런스 시트가 없어요)</p>`
        
    output += `</refsheetflexwrapper>`
    output += `</parbox>`
    
    output += `</bigfurbox></dummycentre>`
    
    document.getElementById("moreinfo_overlay").innerHTML = output
    document.getElementById("moreinfo_overlay").style.display = "block"
}
function hideOverlay() {
    document.getElementById("moreinfo_overlay").style.display = "none"
}

function makeOutput(searchResults) {
    let output = `<p>${i18n[lang].ThisManySearchResults(searchResults.length)}</p>`
    
    searchResults.forEach(it => {
        let id = it.id
        let prop = it.prop
        
        let displayFurNameKo = (prop.name_ko).trim()
        let displayFurNameEn = (prop.name_en).trim()
        let displayFurNameJa = (prop.name_ja).trim()
        
        let actorName = (prop.actor_name).trim()
                            
        let displayActorName = textOrQos(actorName.split("/").shift())
                            
        let displayActorLinkHref = (prop.actor_link.includes(":") ? "" : "@") + prop.actor_link
        if (displayActorLinkHref == "@") displayActorLinkHref = "???"
                            
        let displayActorLinkName = displayActorLinkHref.split("/").pop()
                            
        let displayCreatorName = textOrQos((prop.creator_name).trim().replace("/자작", ""))
        if (displayCreatorName == "자작") displayCreatorName = displayActorName
                            
        let displayCreatorLinkHref = prop.creator_link
                                  
        output += `<furbox>`
        output += `<imgbox onclick="showOverlay(${id})">`
        
        if (prop.photo)
            output += `<img src="${prop.photo}" />`
        else if (prop.ref_sheet)
            output += `<img src="${prop.ref_sheet}" />`
        else
            output += `<img src="no-image-available.png" />`
                        
        output += `</imgbox>`
        output += `<infobox>`
        
        output += `<center>`

        // 0b k e j
        // e.g. 7 if it has all korean & english & japanese name,
        //      2 if it has only english name
        let caseNumber = ((displayFurNameKo.length > 0) << 2) | ((displayFurNameEn.length > 0) << 1) | ((displayFurNameJa.length > 0) << 0)
            
        if (caseNumber >= 4) {
            output += `<h4 class="name_ko">${displayFurNameKo}</h4>`
            
            if (caseNumber % 4 == 0)
                output += `<h4 class="name_en"></h4>`
            else if (caseNumber % 4 == 1)
                output += `<h4 class="name_ja">${displayFurNameJa}</h4>`
            else if (caseNumber % 4 == 2)
                output += `<h4 class="name_en">${displayFurNameEn}</h4>`
            else if (caseNumber % 4 == 3) {
                output += `<h4 class="name_en">${displayFurNameEn}</h4>`
                output += `<h4 class="name_separator"></h4>`
                output += `<h4 class="name_ja">${displayFurNameJa}</h4>`
            }
        }
        else if (caseNumber >= 2) {
            output += `<h4 class="name_ko">${displayFurNameEn}</h4>`
            
            if (caseNumber % 2 == 1)
                output += `<h4 class="name_ja">${displayFurNameJa}</h4>`
            else
                output += `<h4 class="name_en"></h4>`
        }
        else if (caseNumber >= 1) {
            output += `<h4 class="name_ko">${displayFurNameJa}</h4>`
            output += `<h4 class="name_en"></h4>`
        }
        else {
            output += `<h4 class="name_ko">???</h4>`
            output += `<h4 class="name_en"></h4>`
        }
        
        output += `</center>`
        
        output += `<h5 title="${actorName}">${displayActorName}<br /><a href="${displayActorLinkHref}" target="_blank" rel="noopener noreferrer">${displayActorLinkName}</a></h5>`
        output += `<h5>${i18n[lang].MadeBy + ((displayCreatorLinkHref.length == 0) ? displayCreatorName : `<a href="${displayCreatorLinkHref}" target="_blank" rel="noopener noreferrer">${displayCreatorName}</a>`)}</h5>`
        output += `</infobox></furbox>`
    })
    
    document.getElementById("searchResults").innerHTML = output
}

function clearResults() {
    document.getElementById("searchResults").innerHTML = `<p>&nbsp;</p><p style="text-align: center; font-style: oblique; color: #777">(검색 결과가 여기 표시됩니다)</p>`
}

function simplequery() {
    let creatorName = document.getElementById("simplesearch_input_creatorname").value
    if (creatorName == "") creatorName = undefined
    let actorName = document.getElementById("simplesearch_input_actorname").value
    if (actorName == "") actorName = undefined  
    let furName = document.getElementById("simplesearch_input_furname").value
    if (furName == "") furName = undefined
    let birthdayFrom = document.getElementById("simplesearch_input_bday_from").value
    if (birthdayFrom == "") birthdayFrom = undefined
    let birthdayTo = document.getElementById("simplesearch_input_bday_to").value
    if (birthdayTo == "") birthdayTo = undefined
    let species = document.getElementById("simplesearch_dropdown_species").value
    if (species == "dont_care") species = undefined
    let isFullSuit = document.getElementById("simplesearch_input_is_full_suit").value
    if (isFullSuit == "dont_care") isFullSuit = undefined
    let style = document.getElementById("simplesearch_input_style").value
    if (style == "dont_care") style = undefined
    
    let searchFilter = {}
    
    
    let bodyCols = []
    let hairCols = []
    let eyeCols = []
    let eyeFeatures = []
    
    Object.keys(colourPalette).forEach(colour => {
        if (document.getElementById(`body_colours_${colour}`) && document.getElementById(`body_colours_${colour}`).checked)
            bodyCols.push(colour)
            
        if (document.getElementById(`hair_colours_${colour}`) && document.getElementById(`hair_colours_${colour}`).checked)
            hairCols.push(colour)
            
        if (document.getElementById(`eye_colours_${colour}`) && document.getElementById(`eye_colours_${colour}`).checked)
            eyeCols.push(colour)
    })
    
    Object.keys(specialEyeSwatch).forEach(feature => {
        if (document.getElementById(`eye_features_${feature}`) && document.getElementById(`eye_features_${feature}`).checked)
            eyeFeatures.push(feature)
    })
    
    if (creatorName !== undefined) searchFilter.creator_name = creatorName
    if (actorName !== undefined) searchFilter.actor_name = actorName
    if (furName !== undefined) searchFilter.name = furName
    if (birthdayFrom !== undefined) searchFilter.birthday_from = birthdayFrom.replaceAll('-','')
    if (birthdayTo !== undefined) searchFilter.birthday_to = birthdayTo.replaceAll('-','')
    if (isFullSuit !== undefined) searchFilter.is_partial = (isFullSuit === 'false') // this casts string 'true'/'false' into a boolean value and then negates it
    if (species !== undefined) searchFilter.species_ko = dropdownIdToDBname[species]
    if (style !== undefined) searchFilter.style = style

    if (eyeCols.length > 0) searchFilter.eye_colours = eyeCols
    if (bodyCols.length > 0) searchFilter.colour_combi = bodyCols
    if (hairCols.length > 0) searchFilter.hair_colours = hairCols
    if (eyeFeatures.length > 0) searchFilter.eye_features = eyeFeatures
        
    let includeWIP = document.getElementById("includewip_simple").checked
        
    makeOutput(performSearch(searchFilter, "simple", false, includeWIP))
}

function query() {
    let query = document.getElementById("searchtags").value
    let includeWip = document.getElementById("includewip").checked
    
    makeOutput(performTagSearch(query, includeWip))
}


/*
Composes searchFilter by obtaining key-value pair from Danbooru tagging syntax
단부루식 태그 문법에서 key와 value를 분리해 searchFilter를 만듦
 */
function performTagSearch(searchstrr, includeWip) {    
    let foundFurs = [] // contains object in {id: (int), prop: (object)}

    let wipfun = (prop) => includeWip || prop.is_done
    
    let searchstr = searchstrr.trim()
    if (searchstr.length == 0) {
        forEachFur((prop, id) => {
            if (wipfun(prop))
                foundFurs.push({id: id, prop: prop})
        })
    }
    else {
        try {        
            let tns = bF._tokenise(searchstrr)
            tns = bF._parserElaboration(tns.tokens, tns.states)    
            let tree = bF._parseExpr(1, tns.tokens, tns.states, 0)
                        
            console.log(astToString(tree))
            
            forEachFur((prop, id) => {
                if (bF._executeSyntaxTree(prop, tree, 0) && wipfun(prop))
                    foundFurs.push({id: id, prop: prop})
            })
        }
        catch (e) {
            console.log(e)
            alert(i18n[lang].TagParserError+'\n'+e)
        }
    }
    
    return foundFurs;
}

/*
Perform search on the database (JSON)
JSON DB에서 검색 수행

May modify this code to perform searching by sending SQL query to real database
이 소스를 수정해 데이터베이스에 쿼리를 날리는 식으로 동작을 변경할 수 있음

## 검색 필터 규약

아래의 예시 필터를 보자:

filter = {
    "creator_name": "블루폭스",
    "species_ko": ["개","늑대"]
}

- 키값이 undefined여서는 안 됨
- 키값의 type이 array일 때에는, 그 조건에 한해 OR조건으로 처리
- 키값의 type이 object여서는 안 됨
- 이 외 type의 키값은 표준 매칭 방식을 따름

## 표준 매칭 방식

exactMatch가 참일 경우 문자열이 정확히 일치하는지를 검사, 그렇지 않으면 필터키값이 DB값의 일부인지 검사함

 */
const nameSearchAliases = ["name_ko", "name_en", "name_ja", "aliases"]
const pseudoCriteria = {"name":1}
const specialSearchTags = {"birthday_from":1, "birthday_to":1}
const colourMatch = {"colour_combi":1,"hair_colours":1,"eye_colours":1,"eye_features":1}
function performSearch(searchFilter, referrer, exactMatch, includeWIP) {
    let isSearchTagEmpty = searchFilter === undefined
    let foundFurs = [] // contains object in {id: (int), prop: (object)}

    let birthdayFrom = undefined
    let birthdayTo = undefined
    if (!isSearchTagEmpty) {
        birthdayFrom = searchFilter.birthday_from
        birthdayTo = searchFilter.birthday_to
    }
    
    if (birthdayFrom != undefined) {
        // case of 2017 -> 20170000
        if (birthdayFrom < 10000) birthdayFrom *= 10000
        // case of 201712 -> 20171200
        else if (birthdayFrom < 1000000) birthdayFrom *= 100
    }
    
    if (birthdayTo != undefined) {
        // case of 2017 -> 20170000
        if (birthdayTo < 10000) {
            birthdayTo *= 10000
            birthdayTo += 9999
        }
        // case of 201712 -> 20171200
        else if (birthdayTo < 1000000) {
            birthdayTo *= 100
            birthdayTo += 99
        }
    }
    
    
    forEachFur((prop, furid) => {
        let birthday = prop.birthday * 1 // cast to Int
        // case of 2017 -> 20170000
        if (birthday < 10000) birthday *= 10000
        // case of 201712 -> 20171200
        else if (birthday < 1000000) birthday *= 100
        
        let searchMatches = true
                
        // do not check for conditions if search term is empty -> will put every fursuits onto foundFurs
        // 검색 태그가 비어있으면 조건 검사를 하지 않음 -> searchMatches의 초기값이 참이기 때문에 모든 털들을 foundFurs에 집어넣게 됨
        if (!isSearchTagEmpty) {
            for (const searchCriterion in searchFilter) {

                try {                    
                    //console.log(`searchCriterion = ${searchCriterion}`)
                    // check if the tag is valid
                    // 태그가 올바른지 검사
                    if (searchCriterion in prop || searchCriterion in pseudoCriteria) {
                        const arraySearchMode = Array.isArray(searchFilter[searchCriterion])
                        
                        //console.log(`arraySearchMode = ${arraySearchMode}`)
                        //console.log(searchFilter[searchCriterion])
                        
                        // 검색어 sanitise
                        let searchTerm = undefined
                        if (arraySearchMode) {
                            searchTerm = searchFilter[searchCriterion].map(it => (it === undefined) ? it : it.babostr())
                        }
                        else {
                            searchTerm = searchFilter[searchCriterion].babostr()
                        }
                        
                        // disambiguate search term if the criterion is creator_name
                        // 메이커 검색어의 동음이의 처리
                        if (searchCriterion == "creator_name") {
                            if (arraySearchMode) {
                                searchTerm = searchTerm.map(it => (creatorThesaurus[it] !== undefined) ? creatorThesaurus[searchTerm].babostr() : it)
                            }
                            else {
                                if (creatorThesaurus[searchTerm] !== undefined) {
                                    searchTerm = creatorThesaurus[searchTerm].babostr()
                                }
                            }
                        }
                           
                        let matching = prop[searchCriterion]
                                                      
                        if (arraySearchMode) {
                            // matching mode: HASSOMEOF
                            if (searchCriterion == "species_ko") {
                                let partialMatch = false
                                searchTerm.forEach(it => {
                                    partialMatch |= matching.includes(it)
                                })
                                searchMatches &= partialMatch
                            }
                            // matching mode: HASALLOF
                            else if (searchCriterion in colourMatch) {
                                let rainbow = searchTerm.reduce((acc,it) => acc + (it=="적색"||it=="주황색"||it=="황색"||it=="연두색"||it=="초록색"||it=="파란색"||it=="남색")*1, 0) >= 4 // if there are  4 or more maching colours, it's rainbow

                                if (rainbow && matching.includes("무지개색")) {
                                    searchMatches &= true
                                }
                                else {
                                    let partialMatch = true
                                    searchTerm.forEach(it => {
                                        partialMatch &= matching.includes(it)
                                    })
                                    searchMatches &= partialMatch
                                }
                            }
                            else {
                                throw Error("unknown array search criterion: "+searchCriterion)
                            }
                        }
                        else {
                            // 이름은 한/영/일/이명에 대해서도 검색해야 함
                            if (searchCriterion == "name") {
                                let partialMatch = false
                                nameSearchAliases.forEach(it => {
                                    partialMatch |= prop[it].babostr().includes(searchTerm)
                                })
                                searchMatches &= partialMatch
                            }
                            else {
                                searchMatches &= (exactMatch) ? (matching.babostr() == searchTerm.babostr()) : matching.babostr().includes(searchTerm.babostr())
                            }
                        }
                        
                        // 위 대입 식이 searchMatches에 AND하기 때문에 모든 조건을 만족해야만 searchMatches가 최종적으로 true가 됨
                        // OR로 하려면 let searchMatches = false 하고 searchMatches |= ... 하면 됨
                    }
                    // 활동개시일 조건은 별도로 검사
                    // check birthday condition here
                    else if (birthdayFrom !== undefined && birthdayTo !== undefined) {
                        searchMatches &= birthdayFrom <= birthday && birthday <= birthdayTo
                    }
                    else if (birthdayTo !== undefined) {
                        searchMatches &= birthday <= birthdayTo
                    }
                    else if (birthdayFrom !== undefined) {
                        searchMatches &= birthdayFrom <= birthday
                    }
                    // display error message if the tag is not valid
                    // 올바르지 않은 태그면 에러창 띄움
                    else if (!(searchCriterion in specialSearchTags)) {
                        //console.log(i18n[lang].TagSyntaxError + searchCriterion)
                        alert(i18n[lang].TagSyntaxError + searchCriterion)
                        return undefined
                    }
                }
                catch (e) {
                    console.log(e)
                    console.log(e.stack)
                }
            }
        }

        // check for is_done
        // 제작 완성 여부 검사
        if (searchMatches && (includeWIP || prop.is_done)) {
            foundFurs.push({id: furid, prop: prop})
        }
    })

    return foundFurs
}
