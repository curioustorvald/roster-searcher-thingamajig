import java.io.File

val dbFileName = "./html/DB.html"
val photoFileName = "./html/Photo.html"
val outJsonName = "./furdb.json"
val inColumns = arrayOf( // name of the operations
        "_id",
        "name_ko",
        "name_en",
        "_separator_from_the_html",
        "name_ja",
        "creator_name",
        "creator_link_raw",
        "designer_name",
        "designer_link_raw",
        "birthday",
        "actor_name_raw",
        "actor_link_raw",
        "gender",
        "style",
        "is_partial",
        "is_done",
        "desc_raw",
        "is_34partial",
        "is_hidden",
        "aliases_raw"
)
val outColumns = arrayOf( // name of the property that goes directy onto the JSON
        "name_ko",
        "name_en",
        "name_ja",
        "creator_name",
        "creator_link",
        "designer_name",
        "designer_link",
        "birthday",
        "actor_name",
        "actor_link",
        "gender",
        "style",
        "is_partial",
        "is_done",
        "species_ko",
        "is_34partial",
        "is_hidden",
        "aliases"
)

val mainDBraw = File(dbFileName).readText(Charsets.UTF_8).replace("\n", "")
val picturesraw = File(photoFileName).readText(Charsets.UTF_8).replace("\n", "")

val mainDBreplacements = arrayOf(
        Regex("""<meta [^\n]+style="line-height: [0-9]{2,3}px">3</div></th><td class="s[26]">""") to "", // header
        Regex("""</td></tr><tr[^\n>]+><th[^\n>]+><div[^\n>]+>[0-9]+</div></th><td[^\n>]+>""") to "\n", // newline separation
        Regex("""<div[^\n>]+>|</div>|<td[^\n>]+>|<a[^\n>]+>|</a>|<span[^\n>]+>|</span>""") to "", // kill divs, td headers (but not closing td), a and spans
        Regex("""<img src="|=w[0-9]+\-h[0-9]+" style="[^"]+"/>""") to "", // img head and trail
        Regex("""</td>""") to "¤",
        Regex("""</tr></tbody></table>""") to "", // footer
        Regex("""\n[0-9]+¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤\n""") to "\n", // null entries
        Regex("""\n[0-9]+¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤FALSE¤¤¤¤""") to "" // null entries
)

fun makeDSV(raw: String): String = mainDBreplacements.foldIndexed(raw) { i, str, (k, v) ->
    println("Text substitution ${i + 1} / ${mainDBreplacements.size}")
    str.replace(k, v)
}

fun buildTable(dsv: String): List<List<String>> = dsv.lines().map { it.split('¤') }

val mainDSV = makeDSV(mainDBraw)
val photoDSV = makeDSV(picturesraw)
val mainTable = buildTable(mainDSV)
val photoTable = buildTable(photoDSV)

File("./maindb_testout.dsv").writeText(mainDSV)
File("./photodb_testout.dsv").writeText(photoDSV)

val inColsIndices = inColumns.mapIndexed { i, s -> s to i }.toMap()

fun generateLink(name: String, action: String): String {
    if (name.isBlank()) return ""
    return when (action) {
        "twitter" -> "https://twitter.com/$name"
        "http" -> name
        else -> throw IllegalArgumentException(action)
    }
}

fun generateCell(record: List<String>, action: String): String? {
    if (action.startsWith("_")) return null
    
    val value = record[inColsIndices[action]!!]
    
    return if ("is_hidden" == action)
        if (value.isNotBlank()) "TRUE" else "FALSE"
    else if (!action.endsWith("_raw"))
        value.replace("?", "")
    else if ("actor_name_raw" == action)
        if (value.startsWith("(갤럼)")) ""
        else value
    else if ("creator_name_raw" == action)
        value.substringBefore("/자작")
    else if ("actor_link_raw" == action)
        if (value.startsWith("DC:") ||
            value.startsWith("DCA:")) "" // TODO: deal with non-twitter links
        else generateLink(value.substringBefore('/'), "twitter")
    else if ("creator_link_raw" == action || "designer_link_raw" == action)
        if (value.startsWith("http:") ||
            value.startsWith("https:")) value
        else generateLink(value, "twitter")
    else if ("aliases_raw" == action)
        value //.split('/') // just return as-is
    else if ("desc_raw" == action)
        value.substringBefore(',').replace("?", "")
    else
        throw IllegalArgumentException(action)
}

var outJson = StringBuilder()
outJson.append('{')

mainTable.forEach { record ->
    val id = record[0].toInt()

    outJson.append("\"${id}\":{")
    outJson.append(inColumns.map { generateCell(record, it) }.filter { it != null }
        .mapIndexed { i, v -> "\"${outColumns[i]}\":${if (v!!.toLowerCase() == "true" || v.toLowerCase() == "false") v.toLowerCase() else "\"$v\""}" }
        .joinToString(","))

    val mainPhoto = photoTable[id-1][6].replace(Regex("""https://lh[0-9]\.googleusercontent\.com/"""),"")
    val refSheet = photoTable[id-1][8].replace(Regex("""https://lh[0-9]\.googleusercontent\.com/"""),"")

    outJson.append(",\"photo\":\"${if (mainPhoto.isNotBlank()) "images/$mainPhoto" else ""}\"" +
                   ",\"ref_sheet\":\"${if (refSheet.isNotBlank()) "images/$refSheet" else ""}\"},")
}

outJson.set(outJson.lastIndex, '}') // replace last trailing , with }

File(outJsonName).writeText(outJson.toString())
