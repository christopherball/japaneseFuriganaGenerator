document
    .getElementById("generateButton")
    .addEventListener("click", function () {
        const inputText = document.getElementById("inputText").value;
        generateFurigana(inputText);
    });

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

            const tokens = tokenizer.tokenize(text);
            let outputHtml = "";

            tokens.forEach((token) => {
                let readingHiragana = wanakana.toHiragana(token.reading);

                // Where safely possible, hiding repetitive hiragana in readings
                // that are part of the mixed kanji/hiragana token.
                if (!wanakana.isHiragana(token.surface_form)) {
                    [...token.surface_form].forEach((c) => {
                        let re = new RegExp("[^" + c + "]", "g");
                        if (
                            wanakana.isHiragana(c) &&
                            readingHiragana.replace(re, "").length == 1
                        ) {
                            readingHiragana = readingHiragana.replace(
                                c,
                                '<span style="visibility:hidden;">' +
                                    c +
                                    "</span>"
                            );
                        }
                    });
                }

                if (token.surface_form !== readingHiragana) {
                    outputHtml += `<ruby>${token.surface_form}<rt>${readingHiragana}</rt></ruby>`;
                } else {
                    outputHtml += token.surface_form;
                }
            });

            document.getElementById("outputText").innerHTML = outputHtml;
            document.getElementById("outputHTML").value = outputHtml;
        });
}
