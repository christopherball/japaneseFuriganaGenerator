function isKanji(character) {
    let regex = /[\u4e00-\u9faf\u3400-\u4dbf]/;
    return regex.test(character);
}

function splitToken(surfaceForm, readingHiragana) {
    let lastHiraganaIndex = null;
    let extractedHiraganaChunk = "";
    let outputHtml = "";

    [...surfaceForm].forEach((c, index) => {
        if (wanakana.isHiragana(c)) {
            if (lastHiraganaIndex == null || index == lastHiraganaIndex + 1) {
                extractedHiraganaChunk += c;
                lastHiraganaIndex = index;
            }
            // This is the rare bail case where our token has scattered hiragana
            else if (index > lastHiraganaIndex + 1) {
                return `<ruby>${surfaceForm}<rt>${readingHiragana}</rt></ruby>`;
            }
        }
    });

    let extractedHiraganaChunkStartIndex = surfaceForm.indexOf(
        extractedHiraganaChunk
    );

    // Covering case where hiragana is at beginning of token
    if (extractedHiraganaChunkStartIndex == 0) {
        outputHtml += extractedHiraganaChunk;
        outputHtml +=
            "<ruby>" +
            surfaceForm.substring(extractedHiraganaChunk.length) +
            "<rt>" +
            readingHiragana.replace(extractedHiraganaChunk, "") +
            "</rt></ruby>";
    }
    // Covering case where hiragana is in the middle of token
    else if (
        extractedHiraganaChunkStartIndex > 0 &&
        extractedHiraganaChunkStartIndex + extractedHiraganaChunk.length <
            surfaceForm.length
    ) {
        let re = new RegExp(extractedHiraganaChunk + ".+", "g");
        let re2 = new RegExp(".+" + extractedHiraganaChunk, "g");
        let surfChunk1 = surfaceForm.substring(
            0,
            extractedHiraganaChunkStartIndex
        );
        let surfChunk2 = extractedHiraganaChunk;
        let surfChunk3 = surfaceForm.substring(
            surfChunk1.length + surfChunk2.length
        );

        outputHtml +=
            "<ruby>" +
            surfChunk1 +
            "<rt>" +
            readingHiragana.replace(re, "") +
            "</rt></ruby>";
        outputHtml += surfChunk2;
        outputHtml +=
            "<ruby>" +
            surfChunk3 +
            "<rt>" +
            readingHiragana.replace(re2, "") +
            "</rt></ruby>";
    }
    // Covering case where hiragana is at end of token
    else {
        outputHtml +=
            "<ruby>" +
            surfaceForm.replace(extractedHiraganaChunk, "") +
            "<rt>" +
            readingHiragana.replace(extractedHiraganaChunk, "") +
            "</rt></ruby>";
        outputHtml += extractedHiraganaChunk;
    }

    return outputHtml;
}

function generateFurigana(text) {
    kuromoji
        .builder({
            dicPath: "scripts/kuromoji/dict",
        })
        .build(function (err, tokenizer) {
            if (err) {
                console.error(err);
                return;
            }

            const chunks = text.split(/\n/g);
            chunks.forEach((chunk, index) => {
                let outputHtml = "";
                const tokens = tokenizer.tokenize(chunk);

                tokens.forEach((token) => {
                    let readingHiragana = wanakana.toHiragana(token.reading);

                    if (token.surface_form !== readingHiragana) {
                        outputHtml += splitToken(
                            token.surface_form,
                            readingHiragana
                        );
                    } else {
                        outputHtml += token.surface_form;
                    }
                });

                if (index < chunks.length - 1) {
                    outputHtml += "<br/>";
                }

                document.getElementById("outputHTML").innerHTML += outputHtml;
                document.getElementById("outputHTML").value += outputHtml;
                document.getElementById("outputAnkiShorthand").innerHTML +=
                    outputHtml
                        .replaceAll("<ruby>", " ")
                        .replaceAll("</ruby>", "")
                        .replaceAll("<rt>", "[")
                        .replaceAll("</rt>", "]")
                        .trim();
                document.getElementById("outputRenderedHTML").innerHTML +=
                    outputHtml;
            });
        });
}

function copyToClipboard(value) {
    var tempInput = document.createElement("input");
    tempInput.value = value;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
}

function onGenerateButton() {
    const inputText = document.getElementById("inputText").value;
    document.getElementById("outputHTML").value = "";
    document.getElementById("outputAnkiShorthand").innerHTML = "";
    document.getElementById("outputRenderedHTML").innerHTML = "";
    generateFurigana(inputText);
}

function main() {
    document
        .getElementById("generateButton")
        .addEventListener("click", onGenerateButton);

    document.getElementById("copyButton1").addEventListener("click", () => {
        copyToClipboard(document.getElementById("outputHTML").value);
    });

    document.getElementById("copyButton2").addEventListener("click", () => {
        copyToClipboard(
            document.getElementById("outputAnkiShorthand").innerHTML
        );
    });

    document
        .getElementById("outputHTML")
        .addEventListener("input", function () {
            let tempHTML = document.getElementById("outputHTML").value;
            document.getElementById("outputRenderedHTML").innerHTML = tempHTML;
            document.getElementById("outputAnkiShorthand").innerHTML = tempHTML
                .replaceAll("<ruby>", " ")
                .replaceAll("</ruby>", "")
                .replaceAll("<rt>", "[")
                .replaceAll("</rt>", "]")
                .trim();
        });
}

window.onload = main();
