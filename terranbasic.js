/*
Terran BASIC version 1.2 <https://github.com/curioustorvald/TerranBASIC>

Copyright (c) 2020-2021 CuriousTorvald

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
"use strict";

let PROD = true;

// 문자열을 검색하기 좋게 소문자로 바꾸고 띄어쓰기와 언더스코어를 없앰 (언더스코어는 사용자가 검색어에 띄어쓰기 대신 집어넣을 가능성 있음)
String.prototype.babostr = function() {
    if (this === true) return "true"
    else if (this === false) return "false"
    else return this.toLowerCase().replaceAll(" ","").replaceAll("_","").replaceAll(".","")
}
Boolean.prototype.babostr = function() {
    return ''+this
}
Array.prototype.babostr = function() {
    return this.map(it => it.babostr())
}

let tonum = (t) => t*1.0
function cloneObject(o) { return JSON.parse(JSON.stringify(o)) }

class ParserError extends Error {
    constructor(...args) {
        super(...args)
        //Error.captureStackTrace(this, ParserError)
    }
}

let reNumber = /([0-9]*[.][0-9]+[eE]*[\-+0-9]*[fF]*|[0-9]+[.eEfF][0-9+\-]*[fF]?)|([0-9]+(\_[0-9])*)|(0[Xx][0-9A-Fa-f_]+)|(0[Bb][01_]+)/
let reNum = /[0-9]+/

let isAST = (object) => (object === undefined) ? false : object.astLeaves !== undefined && object.astHash !== undefined
let astToString = function(ast, depth, isFinalLeaf) {
    let l__ = "| "
    
    let recDepth = depth || 0
    if (!isAST(ast)) return ""
    
    let hastStr = ast.astHash
    let sb = ""
    let marker = ("lit" == ast.astType) ? "i" :
                 ("op" == ast.astType) ? "+" :
                 ("string" == ast.astType) ? "@" :
                 ("num" == ast.astType) ? "$" :
                 ("array" == ast.astType) ? "[" :
                 ("defun_args" === ast.astType) ? "d" : "f"
    sb += l__.repeat(recDepth)+`${marker} ${ast.astLnum}: "${ast.astValue}" (astType:${ast.astType}); leaves: ${ast.astLeaves.length}; hash:"${hastStr}"\n`
    for (var k = 0; k < ast.astLeaves.length; k++) {
        sb += astToString(ast.astLeaves[k], recDepth + 1, k == ast.astLeaves.length - 1)
        if (ast.astSeps[k] !== undefined)
            sb += l__.repeat(recDepth)+` sep:${ast.astSeps[k]}\n`
    }
    sb += l__.repeat(recDepth)+"`"+"-".repeat(22)+'\n'
    return sb
}
let makeBase32Hash = ()=>[1,2,3,4,5].map(i=>"YBNDRFG8EJKMCPQXOTLVWIS2A345H769"[Math.random()*32|0]).join('')
let BasicAST = function() {
    this.astLnum = 0
    this.astLeaves = []
    this.astSeps = []
    this.astValue = undefined
    this.astType = "null" // lit, op, num
    this.astHash = makeBase32Hash()
}


let basiclang = {}
basiclang.badNumberFormat = Error("Illegal number format")
basiclang.badOperatorFormat = Error("Illegal operator format")
basiclang.divByZero = Error("Division by zero")
basiclang.badFunctionCallFormat = function(line, reason) {
    return Error("Illegal function call" + ((line) ? " in "+line : "") + ((reason) ? ": "+reason : ""))
}
basiclang.unmatchedBrackets = Error("Unmatched brackets")
basiclang.missingOperand = Error("Missing operand")
basiclang.noSuchFile = Error("No such file")
basiclang.outOfData = function(line) {
    return Error("Out of DATA"+(line !== undefined ? (" in "+line) : ""))
}
basiclang.nextWithoutFor = function(line, varname) {
    return Error("NEXT "+((varname !== undefined) ? ("'"+varname+"'") : "")+"without FOR in "+line)
}
basiclang.syntaxfehler = function(line, reason) {
    return Error("Syntax error" + ((line !== undefined) ? (" in "+line) : "") + ((reason !== undefined) ? (": "+reason) : ""))
}
basiclang.illegalType = function(line, obj) {
    return Error("Type mismatch" + ((obj !== undefined) ? ` "${obj} (typeof ${typeof obj})"` : "") + ((line !== undefined) ? (" in "+line) : ""))
 }
basiclang.refError = function(line, obj) {
    serial.printerr(`${line} Unresolved reference:`)
    serial.printerr(`    object: ${obj}, typeof: ${typeof obj}`)
    if (obj !== null && obj !== undefined) serial.printerr(`    entries: ${Object.entries(obj)}`)
    return Error("Unresolved reference" + ((obj !== undefined) ? ` "${obj}"` : "") + ((line !== undefined) ? (" in "+line) : ""))
}
basiclang.nowhereToReturn = function(line) { return "RETURN without GOSUB in " + line }
basiclang.errorinline = function(line, stmt, errobj) {
    return Error('Error'+((line !== undefined) ? (" in "+line) : "")+' on "'+stmt+'": '+errobj)
}
basiclang.parserError = function(line, errorobj) {
    return Error("Parser error in " + line + ": " + errorobj)
}
basiclang.outOfMem = function(line) {
    return Error("Out of memory in " + line)
}
basiclang.dupDef = function(line, varname) {
    return Error("Duplicate definition"+((varname !== undefined) ? (" on "+varname) : "")+" in "+line)
}
basiclang.asgnOnConst = function(line, constname) {
    return Error('Trying to modify constant "'+constname+'" in '+line)
}
basiclang.subscrOutOfRng = function(line, object, index, maxlen) {
    return Error("Subscript out of range"+(object !== undefined ? (' for "'+object+'"') : '')+(index !== undefined ? (` (index: ${index}, len: ${maxlen})`) : "")+(line !== undefined ? (" in "+line) : ""))
}
basiclang.aG = " arguments were given"
basiclang.ord = function(n) {
    if (n % 10 == 1 && n % 100 != 11) return n+"st"
    if (n % 10 == 2 && n % 100 != 12) return n+"nd"
    if (n % 10 == 3 && n % 100 != 13) return n+"rd"
    return n+"th"
}
Object.freeze(basiclang)


let twoArgAND = function(prop, args, action) {
    if (args.length != 2) throw lang.syntaxfehler(1, args.length+lang.aG)
    
    let p = prop[args[0].toLowerCase()].babostr()
    let q = args[1].babostr()
    if (Array.isArray(p)) {
        if (Array.isArray(q)) {
            let ret = true
            for (let x = 0; x < p.length; x++) {
                for (let y = 0; y < q.length; y++) {
                    ret &= action(p[x], q[y])
                }
            }
            return ret
        }
        else {
            let ret = true
            for (let x = 0; x < p.length; x++) {
                ret &= action(p[x], q)
            }
            return ret
        }
    }
    else {
        if (Array.isArray(q)) {
            let ret = true
            for (let y = 0; y < q.length; y++) {
                ret &= action(p, q[y])
            }
            return ret
        }
        else {
            return action(p, q)
        }
    }
}


let bS = {}
bS.builtin = {
    "IS": function(prop, args) {
        return !!twoArgAND(prop, args, (p,q) => p == q)
    },
    "ISNOT": function(prop, args) {
        return !!twoArgAND(prop, args, (p,q) => p != q)
    },
    "ISONEOF": function(prop, args) {
        if (args.length != 2) throw lang.syntaxfehler(1, args.length+lang.aG)
    
        let p = prop[args[0].toLowerCase()].babostr()
        if (Array.isArray(p)) throw basiclang.illegalType(1, p)
        if (!Array.isArray(args[1])) throw basiclang.illegalType(1, args[1])
        let q = args[1].babostr()
        
        return q.findIndex(it => it == p) >= 0
    },
    "ISNONEOF": function(prop, args) {
        return !bS.builtin["ISONEOF"](prop, args)
    },
    ">=": function(prop, args) {
        return !!twoArgAND(prop, args, (p,q) => p >= q)
    },
    "=>": function(prop, args) {
        return !!twoArgAND(prop, args, (p,q) => p >= q)
    },
    "<=": function(prop, args) {
        return !!twoArgAND(prop, args, (p,q) => p <= q)
    },
    "=<": function(prop, args) {
        return !!twoArgAND(prop, args, (p,q) => p <= q)
    },
    ">": function(prop, args) {
        return !!twoArgAND(prop, args, (p,q) => p > q)
    },
    "<": function(prop, args) {
        return !!twoArgAND(prop, args, (p,q) => p < q)
    },
    "HASALLOF": function(prop, args) {
        if (args.length != 2) throw lang.syntaxfehler(1, args.length+lang.aG)
    
        let p = prop[args[0].toLowerCase()].babostr()
        if (typeof p === 'string' || p instanceof String) {
            p = p.split(' ')
        }
        if (!Array.isArray(p)) throw basiclang.illegalType(1, p)
        let q = args[1].babostr()
        if (Array.isArray(q)) {
            let ret = true
            q.forEach(q1 => ret &= (p.findIndex(it => it == q1)>=0))
            return !!ret
        }
        else {
            return p.findIndex(it => it == q) >= 0
        }
    },
    "HASSOMEOF": function(prop, args) {
        if (args.length != 2) throw lang.syntaxfehler(1, args.length+lang.aG)
    
        let p = prop[args[0].toLowerCase()].babostr()
        if (typeof p === 'string' || p instanceof String) {
            p = p.split(' ')
        }
        if (!Array.isArray(p)) throw basiclang.illegalType(1, p)
        let q = args[1].babostr()
        if (Array.isArray(q)) {
            let ret = false
            q.forEach(q1 => ret |= (p.findIndex(it => it == q1)>=0))
            return !!ret
        }
        else {
            return p.findIndex(it => it == q) >= 0
        }
    },
    "HASNONEOF": function(prop, args) {
        return !bS.builtin["HASSOMEOF"](prop, args)
    },
    ",": function(prop, args) {
        if (args.length != 2) throw lang.syntaxfehler(1, args.length+lang.aG)

        let p = args[0]
        let q = args[1]
        
        if (Array.isArray(p) && Array.isArray(q)) {
            return p.concat(q)
        }
        else if (Array.isArray(p)) {
            return p.concat([q.babostr()])
        }
        else if (Array.isArray(q)) {
            return [p.babostr()].concat(q)
        }
        else {
            return [p.babostr(), q.babostr()]
        }
    },
    "AND": function(prop, args) {
        if (args.length != 2) throw lang.syntaxfehler(1, args.length+lang.aG)
        return (args[0] && args[1])
    },
    "OR": function(prop, args) {
        if (args.length != 2) throw lang.syntaxfehler(1, args.length+lang.aG)
        return (args[0] || args[1])
    }
}

Object.freeze(bS)

let bF = {} // BASIC functions
bF._1os = {"<":1,"=":1,">":1,"+":1,",":1}
bF._uos = {"NOT":1}
bF._isNum = function(code) {
    return (code >= 0x30 && code <= 0x39) || code == 0x5F
}
bF._isNum2 = function(code) {
    return (code >= 0x30 && code <= 0x39) || code == 0x5F
}
bF._isNumSep = function(code) {
    return code == 0x2E
}
bF._is1o = function(code) {
    return bF._1os[String.fromCharCode(code)]
}
bF._isUnary = function(code) {
    return false
}
bF._isParenOpen = function(code) {
    return (code == 0x28 || code == 0x5B || code == 0x7B) || (code == '(' || code == '[' || code == '{')
}
bF._isParenClose = function(code) {
    return (code == 0x29 || code == 0x5D || code == 0x7D) || (code == ')' || code == ']' || code == '}')
}
bF._isMatchingParen = function(open, close) {
    return (open == '(' && close == ')' || open == '[' && close == ']' || open == '{' && close == '}')
}
bF._isParen = function(code) {
    return bF._isParenOpen(code) || bF._isParenClose(code)
}
bF._opPrc = {
    ",":80,// array
    "<":80,">":80,"<=":80,"=<":80,">=":80,"=>":80,
    "IS":90,"ISNOT":90,"ISONEOF":90,"ISNONEOF":90,
    "HASALLOF":90,"HASSOMEOF":90,"HASNONEOF":90,
    "AND":300,
    "OR":301
}
bF._opRh = {}

bF.isSemanticLiteral = function(token, state) {
    return undefined == token || "]" == token || ")" == token || "}" == token ||
            "qot" == state || "num" == state || "bool" == state || "lit" == state
}
bF.parserDoDebugPrint = (!PROD) && true
bF.parserPrintdbg = any => { if (bF.parserDoDebugPrint) console.log(any) }
bF.parserPrintdbg2 = function(icon, lnum, tokens, states, recDepth) {
    if (bF.parserDoDebugPrint) {
        let treeHead = "|  ".repeat(recDepth)
        bF.parserPrintdbg(`${icon}${lnum} ${treeHead}${tokens.join(' ')}`)
        bF.parserPrintdbg(`${icon}${lnum} ${treeHead}${states.join(' ')}`)
    }
}
bF.parserPrintdbgline = function(icon, msg, lnum, recDepth) {
    if (bF.parserDoDebugPrint) {
        let treeHead = "|  ".repeat(recDepth)
        bF.parserPrintdbg(`${icon}${lnum} ${treeHead}${msg}`)
    }
}

let _debugprintStateTransition = false
// taken from my other project, TerranBASIC
bF._tokenise = function(cmd) {
    let lnum = 1
    var k; var tokens = []; var states = []; var sb = ""; var mode = "lit"
    
    for (k = 0; k < cmd.length; k++) {
        var char = cmd[k]
        var charCode = cmd.charCodeAt(k)

        if (_debugprintStateTransition) console.log("Char: "+char+"("+charCode+"), state: "+mode)

        if ("lit" == mode) {
            if (0x27 == charCode) { // "
                tokens.push(sb); sb = ""; states.push(mode)
                mode = "qot"
            }
            else if (bF._isParen(charCode)) {
                tokens.push(sb); sb = "" + char; states.push(mode)
                mode = "paren"
            }
            else if (" " == char) {
                tokens.push(sb); sb = ""; states.push(mode)
                mode = "limbo"
            }
            else if (bF._is1o(charCode)) {
                tokens.push(sb); sb = "" + char; states.push(mode)
                mode = "op"
            }
            else {
                sb += char
            }
        }
        else if ("num" == mode) {
            if (bF._isNum(charCode)) {
                sb += char
            }
            else if (bF._isNumSep(charCode)) {
                sb += char
                mode = "nsep"
            }
            else if (0x27 == charCode) {
                tokens.push(sb); sb = ""; states.push(mode)
                mode = "qot"
            }
            else if (" " == char) {
                tokens.push(sb); sb = ""; states.push(mode)
                mode = "limbo"
            }
            else if (bF._isParen(charCode)) {
                tokens.push(sb); sb = "" + char; states.push(mode)
                mode = "paren"
            }
            else if (bF._is1o(charCode)) {
                tokens.push(sb); sb = "" + char; states.push(mode)
                mode = "op"
            }
            else {
                tokens.push(sb); sb = "" + char; states.push(mode)
                mode = "lit"
            }
        }
        else if ("nsep" == mode) {
            if (bF._isNum2(charCode)) {
                sb += char
                mode = "n2"
            }
            else {
                throw basiclang.syntaxfehler(lnum, basiclang.badNumberFormat)
            }
        }
        else if ("n2" == mode) {
            if (bF._isNum2(charCode)) {
                sb += char
            }
            else if (0x27 == charCode) {
                tokens.push(sb); sb = ""; states.push("num")
                mode = "qot"
            }
            else if (" " == char) {
                tokens.push(sb); sb = ""; states.push("num")
                mode = "limbo"
            }
            else if (bF._isParen(charCode)) {
                tokens.push(sb); sb = "" + char; states.push("num")
                mode = "paren"
            }
            else if (bF._is1o(charCode)) {
                tokens.push(sb); sb = "" + char; states.push("num")
                mode = "op"
            }
            else {
                tokens.push(sb); sb = "" + char; states.push("num")
                mode = "lit"
            }
        }
        else if ("op" == mode) {
            if (bF._is1o(charCode)) {
                tokens.push(sb); sb = "" + char; states.push(mode)
                mode = "op"
            }
            else if (bF._isUnary(charCode)) {
                tokens.push(sb); sb = "" + char; states.push(mode)
            }
            else if (bF._isNum(charCode)) {
                tokens.push(sb); sb = "" + char; states.push(mode)
                mode = "num"
            }
            else if (0x27 == charCode) {
                tokens.push(sb); sb = ""; states.push(mode)
                mode = "qot"
            }
            else if (" " == char) {
                tokens.push(sb); sb = ""; states.push(mode)
                mode = "limbo"
            }
            else if (bF._isParen(charCode)) {
                tokens.push(sb); sb = "" + char; states.push(mode)
                mode = "paren"
            }
            else {
                tokens.push(sb); sb = "" + char; states.push(mode)
                mode = "lit"
            }
        }
        else if ("qot" == mode) {
            if (0x27 == charCode) {
                tokens.push(sb); sb = ""; states.push(mode)
                mode = "quote_end"
            }
            else {
                sb += char
            }
        }
        else if ("quote_end" == mode) {
            if (" " == char) {
                sb = ""
                mode = "limbo"
            }
            else if (0x27 == charCode) {
                sb = "" + char
                mode = "qot"
            }
            else if (bF._isParen(charCode)) {
                sb = "" + char
                mode = "paren"
            }
            else if (bF._isNum(charCode)) {
                sb = "" + char
                mode = "num"
            }
            else if (bF._is1o(charCode)) {
                sb = "" + char
                mode = "op"
            }
            else {
                sb = "" + char
                mode = "lit"
            }
        }
        else if ("limbo" == mode) {
            if (char == " ") {
                /* do nothing */
            }
            else if (0x27 == charCode) {
                mode = "qot"
            }
            else if (bF._isParen(charCode)) {
                sb = "" + char
                mode = "paren"
            }
            else if (bF._isNum(charCode)) {
                sb = "" + char
                mode = "num"
            }
            else if (bF._is1o(charCode)) {
                sb = "" + char
                mode = "op"
            }
            else {
                sb = "" + char
                mode = "lit"
            }
        }
        else if ("paren" == mode) {
            if (char == " ") {
                tokens.push(sb); sb = ""; states.push(mode)
                mode = "limbo"
            }
            else if (0x27 == charCode) {
                tokens.push(sb); sb = ""; states.push(mode)
                mode = "qot"
            }
            else if (bF._isParen(charCode)) {
                tokens.push(sb); sb = "" + char; states.push(mode)
                mode = "paren"
            }
            else if (bF._isNum(charCode)) {
                tokens.push(sb); sb = "" + char; states.push(mode)
                mode = "num"
            }
            else if (bF._is1o(charCode)) {
                tokens.push(sb); sb = "" + char; states.push(mode)
                mode = "op"
            }
            else {
                tokens.push(sb); sb = "" + char; states.push(mode)
                mode = "lit"
            }
        }
        else {
            throw Error("Unknown parser state: " + mode)
        }

        if (_debugprintStateTransition) console.log("->"+mode)
    }

    if (sb.length > 0) {
        tokens.push(sb); states.push(mode)
    }

    // filter off initial empty token if the statement does NOT start with literal (e.g. "-3+5")
    if (tokens[0].length == 0) {
        tokens = tokens.slice(1, tokens.length)
        states = states.slice(1, states.length)
    }
    // clean up operator2 and number2
    for (k = 0; k < states.length; k++) {
        if (states[k] == "o2" || states[k] == "o3") states[k] = "op"
        else if (states[k] == "n2" || states[k] == "nsep") states[k] = "num"
    }

    if (tokens.length != states.length) {
        throw new BASICerror("size of tokens and states does not match (line: "+lnum+")\n"+
        tokens+"\n"+states)
    }

    return { "tokens": tokens, "states": states }
}

let _debugprintElaboration = true
bF._parserElaboration = function(ltokens, lstates) {
    let lnum = 1
    let tokens = cloneObject(ltokens)
    let states = cloneObject(lstates)
    
    let k = 0

    // NOTE: malformed numbers (e.g. "_b3", "_", "__") must be re-marked as literal or syntax error
    
    while (k < states.length) { // using while loop because array size will change during the execution
        // turn errenously checked as number back into a literal
        if (states[k] == "num" && !reNumber.test(tokens[k]))
            states[k] = "lit"
        // turn back into an op if operator is errenously checked as a literal
        else if (states[k] == "lit" && bF._opPrc[tokens[k].toUpperCase()] !== undefined)
            states[k] = "op"
        // turn TRUE and FALSE into boolean
        else if ((tokens[k].toUpperCase() == "TRUE" || tokens[k].toUpperCase() == "FALSE") && states[k] == "paren")
            states[k] = "bool"
        
        // decimalise hex/bin numbers (because Nashorn does not support binary literal)
        if (states[k] == "num") {
            if (tokens[k].toUpperCase().startsWith("0B")) {
                tokens[k] = parseInt(tokens[k].substring(2, tokens[k].length), 2) + ""
            }
        }

        k += 1
    }
        
    k = 0; let l = states.length
    while (k < l) {
        let lookahead012 = tokens[k]+tokens[k+1]+tokens[k+2]
        let lookahead01 = tokens[k]+tokens[k+1]
        
        // turn three consecutive ops into a trigraph
        if (k < states.length - 3 && states[k] == "op" && states[k+1] == "op" && states[k+2] == "op" && bF._opPrc[lookahead012]) {
            if (_debugprintElaboration) console.log(`[ParserElaboration] Line ${lnum}: Trigraph (${lookahead012}) found starting from the ${basiclang.ord(k+1)} token of [${tokens}]`)
            
            tokens[k] = lookahead012
            
            // remove two future elements by splicing them
            let oldtkn = cloneObject(tokens)
            let oldsts = cloneObject(states)
            tokens = oldtkn.slice(0, k+1).concat(oldtkn.slice(k+3, oldtkn.length))
            states = oldsts.slice(0, k+1).concat(oldsts.slice(k+3, oldsts.length))
            l -= 2
        }
        // turn two consecutive ops into a digraph
        else if (k < states.length - 2 && states[k] == "op" && states[k+1] == "op" && bF._opPrc[lookahead01]) {
            if (_debugprintElaboration) console.log(`[ParserElaboration] Line ${lnum}: Digraph (${lookahead01}) found starting from the ${basiclang.ord(k+1)} token of [${tokens}]`)
            
            tokens[k] = lookahead01
            
            // remove two future elements by splicing them
            let oldtkn = cloneObject(tokens)
            let oldsts = cloneObject(states)
            tokens = oldtkn.slice(0, k+1).concat(oldtkn.slice(k+2, oldtkn.length))
            states = oldsts.slice(0, k+1).concat(oldsts.slice(k+2, oldsts.length))
            l -= 1
        }
        // turn qot back into lit
        else if (states[k] == "qot")
            states[k] = "lit"

        k += 1
    }
    
    return {"tokens":tokens, "states":states}
}

/*
EBNF:

expr = expr , op , expr
     | op_uni , expr    
*/

/** Parses following EBNF rule:
expr = (* this basically blocks some funny attemps such as using DEFUN as anon function because everything is global in BASIC *)
      expr , op , expr
    | op_uni , expr 

 * @return: BasicAST
 */
bF._parseExpr = function(lnum, tokens, states, recDepth, ifMode) {
    bF.parserPrintdbg2('e', lnum, tokens, states, recDepth)

    /*************************************************************************/

    // ## special case for virtual dummy element (e.g. phantom element on "PRINT SPC(20);")
    if (tokens[0] === undefined && states[0] === undefined) {
        let treeHead = new BasicAST()
        treeHead.astLnum = lnum
        treeHead.astValue = undefined
        treeHead.astType = "null"

        return treeHead
    }

    /*************************************************************************/

    let headTkn = tokens[0].toUpperCase()
    let headSta = states[0]

    /*************************************************************************/

    // ## case for:
    //    lit
    if (tokens.length == 1) {
        bF.parserPrintdbgline('e', 'Literal Call', lnum, recDepth)
        return bF._parseLit(lnum, tokens, states, recDepth + 1)
    }

    /*************************************************************************/

    // scan for operators with highest precedence, use rightmost one if multiple were found
    let topmostOp
    let topmostOpPrc = 0
    let operatorPos = -1

    // find and mark position of parentheses
    // properly deal with the nested function calls
    let parenDepth = 0
    let parenStart = -1
    let parenEnd = -1
    let curlyDepth = 0
    let curlyStart = -1
    let curlyEnd = -1
    let uptkn = ""
    
    // Scan for unmatched parens and mark off the right operator we must deal with
    // every function_call need to re-scan because it is recursively called
    for (let k = 0; k < tokens.length; k++) {
        // increase paren depth and mark paren start position
        if (tokens[k] == "(" && states[k] == "paren") {
            parenDepth += 1
            if (parenStart == -1 && parenDepth == 1) parenStart = k
        }
        // increase curly depth and mark curly start position
        else if (tokens[k] == "{" && states[k] == "paren") {
            curlyDepth += 1
            if (curlyStart == -1 && curlyDepth == 1) curlyStart = k
        }
        // decrease paren depth
        else if (tokens[k] == ")" && states[k] == "paren") {
            if (parenEnd == -1 && parenDepth == 1) parenEnd = k
            parenDepth -= 1
        }
        // decrease curly depth
        else if (tokens[k] == "}" && states[k] == "paren") {
            if (curlyEnd == -1 && curlyDepth == 1) curlyEnd = k
            curlyDepth -= 1
        }
        
        // determine the right operator to deal with
        if (parenDepth == 0 && curlyDepth == 0) {
            let uptkn = tokens[k].toUpperCase()
            
            if (states[k] == "op" && bF.isSemanticLiteral(tokens[k-1], states[k-1]) &&
                    ((bF._opPrc[uptkn] > topmostOpPrc) ||
                        (!bF._opRh[uptkn] && bF._opPrc[uptkn] == topmostOpPrc))
            ) {
                topmostOp = uptkn
                topmostOpPrc = bF._opPrc[uptkn]
                operatorPos = k
            }
        }
    }

    // unmatched brackets, duh!
    if (parenDepth != 0) throw basiclang.syntaxfehler(lnum, basiclang.unmatchedBrackets)
    if (curlyDepth != 0) throw basiclang.syntaxfehler(lnum, basiclang.unmatchedBrackets)

    /*************************************************************************/

    
    // ## case for:
    //    | "(" , [expr] , ")"
    if (parenStart == 0 && parenEnd == tokens.length - 1) {
        bF.parserPrintdbgline('e', '( [Expr] )', lnum, recDepth)

        return bF._parseExpr(lnum,
            tokens.slice(parenStart + 1, parenEnd),
            states.slice(parenStart + 1, parenEnd),
            recDepth + 1
        )
    }
    
    /*************************************************************************/

    // ## case for:
    //    | expr , op, expr
    //    | op_uni , expr
    // if operator is found, split by the operator and recursively parse the LH and RH
    if (topmostOp !== undefined) {
        bF.parserPrintdbgline('e', 'Operators', lnum, recDepth)

        // this is the AST we're going to build up and return
        // (other IF clauses don't use this)
        let treeHead = new BasicAST()
        treeHead.astLnum = lnum
        treeHead.astValue = topmostOp
        treeHead.astType = "op"

        // BINARY_OP?
        if (operatorPos > 0) {
            let subtknL = tokens.slice(0, operatorPos)
            let substaL = states.slice(0, operatorPos)
            let subtknR = tokens.slice(operatorPos + 1, tokens.length)
            let substaR = states.slice(operatorPos + 1, tokens.length)

            treeHead.astLeaves[0] = bF._parseExpr(lnum, subtknL, substaL, recDepth + 1)
            treeHead.astLeaves[1] = bF._parseExpr(lnum, subtknR, substaR, recDepth + 1)
        }
        else {
            if (topmostOp === "-") treeHead.astValue = "UNARYMINUS"
            else if (topmostOp === "+") treeHead.astValue = "UNARYPLUS"
            else if (topmostOp === "NOT") treeHead.astValue = "UNARYLOGICNOT"
            else if (topmostOp === "BNOT") treeHead.astValue = "UNARYBNOT"
            else if (topmostOp === "@") treeHead.astValue = "MRET"
            else if (topmostOp === "`") treeHead.astValue = "MJOIN"
            else throw new ParserError(`Unknown unary op '${topmostOp}'`)

            treeHead.astLeaves[0] = bF._parseExpr(lnum,
                tokens.slice(operatorPos + 1, tokens.length),
                states.slice(operatorPos + 1, states.length),
                recDepth + 1
            )
        }

        return treeHead
    }
    
    /*************************************************************************/

    throw new ParserError(`Expression "${tokens.join(" ")}" cannot be parsed`)
} // END of EXPR

/**
 * @return: BasicAST
 */
bF._parseLit = function(lnum, tokens, states, recDepth, functionMode) {
    bF.parserPrintdbg2('i', lnum, tokens, states, recDepth)

    if (!Array.isArray(tokens) && !Array.isArray(states)) throw new ParserError("Tokens and states are not array")
    if (tokens.length != 1) throw new ParserError("parseLit 1")

    let treeHead = new BasicAST()
    treeHead.astLnum = lnum
    treeHead.astValue = ("qot" == states[0]) ? tokens[0] : tokens[0].toUpperCase()
    treeHead.astType = ("qot" == states[0]) ? "string" :
        ("num" == states[0]) ? "num" :
        (functionMode) ? "function" : "lit"

    return treeHead
}

let _debugExec = !PROD
bF._executeSyntaxTree = function(prop, syntaxTree, recDepth) {
  
    let recWedge = ">".repeat(recDepth+1) + " "
    let tearLine = "\n  =====ExecSyntaxTree=====  "+("<".repeat(recDepth+1))+"\n"
    
    if (syntaxTree.astValue == undefined && syntaxTree.mVal == undefined) { // empty meaningless parens
        if (syntaxTree.astLeaves.length > 1) throw Error("WTF")
        return bF._executeSyntaxTree(prop, syntaxTree.astLeaves[0], recDepth)
    }
    else if (syntaxTree.astType == "num") {
        if (_debugExec) console.log(recWedge+"num "+(tonum(syntaxTree.astValue)))
        let r = tonum(syntaxTree.astValue)
        if (_debugExec) console.log(tearLine)
        return r
    }
    else if (syntaxTree.astType == "op") {
        let args = syntaxTree.astLeaves.map(it => bF._executeSyntaxTree(prop, it, recDepth + 1))
        let r = bS.builtin[syntaxTree.astValue](prop, args)
        if (_debugExec) console.log(tearLine)
        return r
    }
    else if (syntaxTree.astType == "lit" || literalTypes.includes(syntaxTree.astType)) {
        if (_debugExec) {
            console.log(recWedge+"literal with astType: "+syntaxTree.astType+", astValue: "+syntaxTree.astValue)
            if (isAST(syntaxTree.astValue)) {
                console.log(recWedge+"astValue is a tree, unpacking: \n"+astToString(syntaxTree.astValue))
            }
        }
        let r = syntaxTree.astValue
        if (_debugExec) console.log(tearLine)
        return r
    }
    else if (syntaxTree.astType == "null") {
        if (_debugExec) console.log(recWedge+"null")
        let r = bF._executeSyntaxTree(prop, syntaxTree.astLeaves[0], recDepth + 1)
        if (_debugExec) console.log(tearLine)
        return r
    }
    else {
        console.log(recWedge+"Parsing error in "+lnum)
        console.log(recWedge+astToString(syntaxTree))
        throw Error("Parsing error")
    }
}

Object.freeze(bF)
