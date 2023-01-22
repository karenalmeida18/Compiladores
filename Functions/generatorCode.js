
function getKeyByInput() {
    const textInputUser = document.getElementById('text-input-user');

    return new Promise((resolve) => {
        textInputUser.addEventListener('keypress', event => {
            let val = '';
            if (event.key === 'Enter') val = event.target.value;
            const values = val && val.split('\n');
            const currentVal = values && values[values.length - 1];
            if (currentVal) {
                resolve(currentVal);
            }
        })
    });
}

function getVarsToRead(tokens, index) {
    const vars = [];
    let nextIndex = index;
    let nextToken = tokens[nextIndex];
    while (nextToken.lexema !== ')') {
        if (nextToken.token === 'id') vars.push(nextToken.lexema);
        nextIndex++;
        nextToken = tokens[nextIndex];
    }
    return vars;
};

async function readBlock(tokens) {
    const textCode = document.getElementById('text-code');
    let varsWithValue = {};
    let varsToPrint = [];
    let ignoreElse = false;

    try {
        for (let index = 0; index < tokens.length; index++) {
            const { lexema } = tokens[index];
            if (['write', 'writeln'].includes(lexema) && tokens[index + 1].lexema === '(') {
                index = index + 2;
                let nextToken = tokens[index];
                let currentText = '';
                while (nextToken.lexema !== ')' && (index < tokens.length)) {
                    currentText = currentText.concat(`${nextToken.lexema} `);
                    index++;
                    nextToken = tokens[index];
                }
                varsToPrint = currentText?.replace(/'(.*?)'/, '')?.replace(/[\s]+/g, '').split(',');
                if (varsToPrint) {
                    varsToPrint.forEach((currentVar) => {
                        const varToReplace = varsWithValue[currentVar.toLowerCase()];
                        let textToReplace = currentText.match(/'(.*?)'/);
                        if (textToReplace && varToReplace) currentText = textToReplace[0].concat(`, ${varToReplace}`);
                        else if (varToReplace) currentText = currentText.replace(currentVar, varToReplace);
                    })
                }
                const prevValue = textCode?.textContent || '';
                textCode.innerHTML = prevValue.concat(currentText, '\n');
            }

            if (['read', 'readln'].includes(lexema) && tokens[index + 1].lexema === '(') {
                index = index + 2;
                const varsToRead = getVarsToRead(tokens, index) || [];
                let val = '';

                for await (let currVar of varsToRead) {
                    val = await getKeyByInput();
                    if (val) {
                        varsWithValue = { ...varsWithValue, [currVar.toLowerCase()]: val };
                    }
                }
            }

            if (lexema === ':=') {
                const prevIndex = index - 1;
                const prevToken = tokens[prevIndex];
                const result = [prevToken.lexema.toLowerCase()];
                let expression = '';
                let expressionResult = '';

                let nextTokenValue = '';
                let nextTokenSimbol = '';

                index++;
                let nextToken = tokens[index];
                while ((nextToken.lexema !== ';' && nextToken.token !== 'reserved')) {
                    if (index >= tokens.length) break;
                    if (nextToken.token === 'id') {
                        nextTokenValue = varsWithValue[nextToken.lexema.toLowerCase()] || 0;
                        expression = expression.concat(`${nextTokenValue}`);
                    }
                    if (nextToken.token === 'simbol') {
                        nextTokenSimbol = nextToken.lexema;
                        expression = expression.concat(`${nextTokenSimbol}`);
                    }
                    if (nextToken.token === 'num') {
                        expression = expression.concat(`${nextToken.lexema}`);
                    }
                    index++;
                    nextToken = tokens[index];
                }

                expressionResult = eval(expression);
                varsWithValue = { ...varsWithValue, [result]: expressionResult?.toString() };
            }

            if (lexema === 'if') {
                let expression = '';

                let nextToken = tokens[index];
                while (nextToken.lexema !== 'then' && index < tokens.length) {
                    if (nextToken.token === 'id') {
                        nextTokenValue = varsWithValue[nextToken.lexema.toLowerCase()]
                        expression = expression.concat(`${nextTokenValue}`);
                    }
                    if (nextToken.token === 'simbol') {
                        nextTokenSimbol = nextToken.lexema;
                        expression = expression.concat(`${nextTokenSimbol}`);
                    }
                    if (nextToken.token === 'num') {
                        expression = expression.concat(`${nextToken.lexema}`);
                    }
                    index++;
                    nextToken = tokens[index];
                }
                // ignore else, execute if
                if (eval(expression)) {
                    ignoreElse = true;
                    continue;
                }
                // ignore if, go to else
                else while (nextToken.lexema !== 'else') {
                    index++;
                    nextToken = tokens[index];
                }
            }

            if (ignoreElse && lexema === 'else') {
                index++;
                nextToken = tokens[index];
                if (nextToken.lexema === 'begin') {
                    while (nextToken.lexema !== 'end') {
                        index++;
                        nextToken = tokens[index];
                    }
                    ignoreElse = false;
                }
                else if (nextToken.token === 'id') {
                    while (nextToken.lexema !== ';' && nextToken.token !== 'reserved') {
                        index++;
                        nextToken = tokens[index];
                    }
                    ignoreElse = false;
                }
            }
        }
    } catch (err) {
        alert('Algo deu errado... Verifique se inseriu as entradas corretamente e tente novamente.');
        document.getElementById('text-input-user').value = '';
    }
}


module.exports = {
    readBlock,
};