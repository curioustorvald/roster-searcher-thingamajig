import java.io.File
import java.time.*
import java.time.format.DateTimeFormatter

object Main {
    
    // APPLICATION CONFIGURATION //

    @JvmStatic val dbFileName = "./html/DB.html"
    @JvmStatic val photoFileName = "./html/Photo.html"
    @JvmStatic val outJsonName = "./furdb.json"
    @JvmStatic val includeHidden = false
    @JvmStatic val inColumns = arrayOf( // name of the operations
            "_id",
            "name_ko",
            "name_en",
            "_separator_from_the_html",
            "name_ja",
            "creator_name",
            "creator_link_raw",
            "_designer_name",
            "_designer_link_raw",
            "birthday",
            "actor_name_raw",
            "actor_link_raw",
            "_gender",
            "style",
            "is_partial",
            "is_done",
            "species_raw",
            "colour_combi",
            "hair_colours",
            "eye_colours",
            "eye_features",
            "is_34partial",
            "is_hidden", // this line WON'T get into the JSON but don't remove it otherwise the filtering wouldn't work
            "aliases_raw",
            "photo_copying",
            "photo_link",
            "ref_sheet_copying",
            "ref_sheet"
    )
    @JvmStatic val outColumns = arrayOf( // name of the property that goes directy onto the JSON
            "name_ko",
            "name_en",
            "name_ja",
            "creator_name",
            "creator_link",
//            "designer_name",
//            "designer_link",
            "birthday",
            "actor_name",
            "actor_link",
//            "gender",
            "style",
            "is_partial",
            "is_done",
            "species_ko",
            "colour_combi",
            "hair_colours",
            "eye_colours",
            "eye_features",
            "is_34partial",
            "is_hidden", // this line WON'T get into the JSON but don't remove it otherwise the filtering wouldn't work
            "aliases",
            "photo_copying",
            "photo",
            "ref_sheet_copying",
            "ref_sheet"
    )

    @JvmStatic val colourNames = arrayOf("베이지","블론드","골든","골드")
    @JvmStatic val colourSuffixes = arrayOf("색","포인트")
    @JvmStatic val colourPrefixes = arrayOf("네온","연","진","남")
    @JvmStatic val colourRegex = Regex("""${colourNames.joinToString("|")}|${colourSuffixes.map { "[가-힣]+$it" }.joinToString("|")}|${colourPrefixes.map { "$it[가-힣]+" }.joinToString("|") }""")
    @JvmStatic val hairRegex = Regex("""(${colourRegex})(?= (머리카락|브릿지))""") // don't remove parens around (${colourRegex})
    @JvmStatic val eyesRegex = Regex("""[가-힣]안""")
    
    // END OF APPLICATION CONFIGURATION //

    @JvmStatic val inColsIndices = inColumns.mapIndexed { i, s -> s to i }.toMap()

    @JvmStatic val mainDBraw = File(dbFileName).readText(Charsets.UTF_8).replace("\n", "")
    //@JvmStatic val picturesraw = File(photoFileName).readText(Charsets.UTF_8).replace("\n", "")

    @JvmStatic val mainDBreplacements = arrayOf(
            Regex("""<meta [^\n]+style="line-height: [0-9]{2,3}px">3</div></th><td class="s[0-9]">""") to "", // header
            Regex("""</td></tr><tr[^\n>]+><th[^\n>]+><div[^\n>]+>[0-9]+</div></th><td[^\n>]+>""") to "\n", // newline separation
            Regex("""<div[^\n>]+>|</div>|<td[^\n>]+>|<a[^\n>]+>|</a>|<span[^\n>]+>|</span>""") to "", // kill divs, td headers (but not closing td), a and spans
            Regex("""<img src="|=w[0-9]+\-h[0-9]+" style="[^"]+"/>""") to "", // img head and trail
            Regex("""</td>""") to "¤",
            Regex("""</tr></tbody></table>""") to "", // footer
            Regex("""</?(td|p)>""") to "", // crap
            Regex("""\n[0-9]+¤{21,}\n""") to "\n", // null entries
            Regex("""\n[0-9]+¤{17,}FALSE¤{4,}""") to "" // null entries
    )

    @JvmStatic fun <T> Array<T>.linearSearch(selector: (T) -> Boolean): Int? {
        this.forEachIndexed { index, it ->
            if (selector.invoke(it)) return index
        }

        return null
    }

    @JvmStatic fun makeDSV(raw: String): String = mainDBreplacements.foldIndexed(raw) { i, str, (k, v) ->
        println("Text substitution ${i + 1} / ${mainDBreplacements.size}")
        str.replace(k, v)
    }

    @JvmStatic fun buildTable(dsv: String): List<List<String>> = dsv.lines().map { it.split('¤') }

    @JvmStatic fun generateLink(name: String, action: String): String {
        if (name.isBlank()) return ""
        return when (action) {
            "twitter" -> "https://twitter.com/$name"
            "http" -> name
            else -> throw IllegalArgumentException(action)
        }
    }

    @JvmStatic private val photocopyingActions = arrayOf("photo_copying", "photo_link", "ref_sheet_copying", "ref_sheet")
    @JvmStatic private val arrayActions = arrayOf("colour_combi", "hair_colours", "eye_colours", "eye_features")
    
    @JvmStatic fun generateCell(record: List<String>, action: String): String? {
        if (action.startsWith("_")) return null
        
        val value = record[inColsIndices[action]!!]
        
        return if ("is_hidden" == action)
            if (value.isNotBlank()) "TRUE" else "FALSE"
        else if (action in photocopyingActions)
            value
        else if (action in arrayActions) {
            val arr = generateArrayCell(value)
            if (arr.isEmpty() || arr[0].isBlank()) "[[]]"
            else "[[" + generateArrayCell(value).map { "\"$it\"" }.joinToString(",") + "]]"
        }
        else if ("birthday" == action)
            try {
                value.toInt(); return value
            } catch (e: NumberFormatException) {
                return ""
            }
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
        else if ("species_raw" == action)
            value.substringBefore(',').replace("?", "").substringBefore('(').trim()
        else
            throw IllegalArgumentException(action)
    }

    // must return empty array if there is no content in the record
    @JvmStatic fun generateArrayCell(cell: String): Array<String> {
        val out = ArrayList<String>()
        cell.split(' ').forEach { out.add(it) }
        return out.toTypedArray()
    }
    
    /**
     * @return Pair Of <Body Colours, Hair Colours>
     */
    @JvmStatic fun parseGetColours(descRaw: String): Pair<List<String>, List<String>> {
        val colourWords = colourRegex.findAll(descRaw).map { it.groupValues[0] }.toList().reversed()
        val hairWords = parseGetHairs(descRaw)
        val removal = colourWords.indices.map { intArrayOf(it, 1) }
        // remove hairWords from colourWords and return it;
        // mark words for removal
        hairWords.reversed().forEach { hairword ->
            for (index in colourWords.indices) {
                val colourword = colourWords[index]
                if (hairword == colourword) {
                    removal[index][1] = 0
                    break
                }
            }
        }
        // create list of words that are not marked for removal
        val newWords = ArrayList<String>()
        removal.forEach {
            if (it[1] == 1) newWords.add(colourWords[it[0]])
        }

        return newWords.toList().reversed() to hairWords
    }

    @JvmStatic private fun parseGetHairs(descRaw: String): List<String> {
        try {
            return hairRegex.findAll(descRaw).map { it.groupValues }.map { it.first() }.toList()
        }
        catch (e: java.util.NoSuchElementException) {
            return listOf("")
        }
    }

    @JvmStatic fun parseGetEyeColour(descRaw: String): List<String> {
        val matches = eyesRegex.findAll(descRaw).map { it.groupValues[0] }.toList().filter { !colourNames.contains(it) } // will contain one or more eye colours and zero or one '역안'
        return matches
    }

    @JvmStatic fun main(args: Array<String>) {
        val mainDSV = makeDSV(mainDBraw)
        //val photoDSV = makeDSV(picturesraw)
        val mainTable = buildTable(mainDSV)
        //val photoTable = buildTable(photoDSV)

        //File("./maindb_testout.dsv").writeText(mainDSV)
        //File("./photodb_testout.dsv").writeText(photoDSV)

        val outJson = StringBuilder()
        val lastUpdate = "${LocalDateTime.now(ZoneId.of("UTC")).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))} (UTC)"
        outJson.append("{\"last_update\":\"${lastUpdate}\",\n")

        mainTable.forEach { record ->
            val id = record[0].toInt()

            val line = StringBuilder()

            line.append("\"${id}\":{")
            line.append(inColumns.map { generateCell(record, it) }.filter { it != null }
                .mapIndexed { i, v -> "\"${outColumns[i]}\":${if (v!!.toLowerCase() == "true" || v.toLowerCase() == "false") v.toLowerCase() else "\"${v.trim()}\""}" }
                .joinToString(","))

            line.append("}")

            if (!line.contains("\"is_hidden\":true") || includeHidden) {
                outJson.append(line.toString())
                outJson.append(",\n")
            }
        }
        
        outJson.deleteRange(outJson.lastIndex - 1, outJson.lastIndex) // remove trailing (,\n)
        outJson.append("}") // close the json

        var outstr = outJson.toString()
            .replace(Regex("""\"is_hidden\":true,"""), "")
            .replace(Regex("""\"is_hidden\":false,"""), "")
            // replace "[[ ]]" into [ ]
            .replace(Regex("""\"\[\["""), "[")
            .replace(Regex("""\]\]\""""), "]")
                
        File(outJsonName).writeText(outstr)
        println("Last update: ${lastUpdate}")
    }
}
