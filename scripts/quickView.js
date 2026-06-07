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
        extractedHiraganaChunk,
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
            extractedHiraganaChunkStartIndex,
        );
        let surfChunk2 = extractedHiraganaChunk;
        let surfChunk3 = surfaceForm.substring(
            surfChunk1.length + surfChunk2.length,
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

            const parseMode = document.getElementById("lineBreak").value;
            let chunks = null;

            if (parseMode == "default") {
                chunks = text.split(/\n/g).map((c) => {
                    return c;
                });
            } else {
                chunks = text
                    .split("。")
                    .filter((c) => c.length > 0)
                    .map((c) => {
                        return c + "。";
                    });
            }

            chunks.forEach((chunk, index) => {
                let outputHtml = "";
                const tokens = tokenizer.tokenize(chunk);

                tokens.forEach((token) => {
                    let readingHiragana = wanakana.toHiragana(token.reading);

                    if (
                        token.reading !== undefined &&
                        token.surface_form !== readingHiragana &&
                        token.surface_form !== token.reading
                    ) {
                        outputHtml += splitToken(
                            token.surface_form,
                            readingHiragana,
                        );
                    } else {
                        outputHtml += token.surface_form;
                    }
                });
                if (index < chunks.length - 1) {
                    if (parseMode == "single") {
                        outputHtml += "<br/>";
                    } else if (parseMode == "double") {
                        outputHtml += "<br/><br/>";
                    }
                }

                document.getElementById("outputRenderedHTML").innerHTML +=
                    outputHtml;
            });
            document.getElementById("generateButton").disabled = false;
        });
}

function onGenerateButton() {
    const inputText = document.getElementById("inputText").value;
    document.getElementById("outputRenderedHTML").innerHTML = "";
    document.getElementById("generateButton").disabled = true;
    generateFurigana(inputText);
}

function onPasteButton() {
    navigator.clipboard.readText().then((clipText) => {
        document.getElementById("inputText").value = clipText;
        document
            .getElementById("generateButton")
            .dispatchEvent(new Event("click"));
    });
}

function main() {
    document
        .getElementById("generateButton")
        .addEventListener("click", onGenerateButton);

    document
        .getElementById("pasteButton")
        .addEventListener("click", onPasteButton);

    document.getElementById("inputText").addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";
    });

    document
        .getElementById("exampleLink")
        .addEventListener("click", function () {
            document.getElementById("inputText").value = this.dataset.example;
            document
                .getElementById("generateButton")
                .dispatchEvent(new Event("click"));
        });
}

window.onload = main();
