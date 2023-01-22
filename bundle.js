(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

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
},{}],2:[function(require,module,exports){

const reserved = require('../Rules/reserved');
const simbols = require('../Rules/simbols');
const comments = require('../Rules/comments');

const IDENTFIER = /([_]*[a-zA-Z0-9_]{1,15})/;

// Separa o código por quebra de linha e também pelos simbolos da linguagem
function splitCode(code) {
    const separateLines = code.split(/\r?\n|\r|\n/g);
    let tokensForLine = [];

    for (let i = 0; i < tokensForLine.length; i++) if ((/(\s+)/).test(tokensForLine[i])) tokensForLine.splice(i, 1);

    separateLines.forEach((line, index) => {
        // Separa o código por quebra de linha e pelos simbolos
        let currentTokens = line.split(/([\s-]+|[+, -, /, *, **, (, ), <, >, <>, <=, =>, :=, =, ;, ,, //, {, }, :, ., ', "])/);
        // Filtra espaços em brancos e vazio
        currentTokens = currentTokens.filter((token) => token && !(/(\s)/g).test(token));
        // Adiciona os tokens em array por linha
        if (currentTokens.length > 0) {
            tokensForLine.push({
                line: index + 1,
                tokens: currentTokens,
            })
        }
    });

    return tokensForLine;
};

function isReserved(codeSplited) {
    return reserved.includes(codeSplited);
};

function isSimbol(codeSplited) {
    return simbols.includes(codeSplited);
};

function isComment(codeSplited) {
    return comments.includes(codeSplited);
}

function isNumber(codeSplited) {
    return codeSplited && !isNaN(Number(codeSplited));
}

function isIdentifier(codeSplited) {
    return (IDENTFIER).test(codeSplited);
};

function IdentifierHasMaxLength(codeSplited) {
    return codeSplited.length > 15;
};

function NumberHasMaxLength(codeSplited) {
    return codeSplited.length > 20;
};

function getComment(codeSplitedArray, i) {
    let comment = ''
    let index = i;
    let code = codeSplitedArray[index];
    while (code !== '}' && index < codeSplitedArray.length) {
        comment = comment.concat(`${code} `);
        index++;
        code = codeSplitedArray[index];
    }

    return { comment, index };
}

function verifyCommentIsClosed(codeSplitedArray) {
    const allCommentsOpened = codeSplitedArray.filter((code) => code === '{');
    const allCommentsClosed = codeSplitedArray.filter((code) => code === '}');

    return allCommentsClosed.length === allCommentsOpened.length;
}


// Separa o codigo inserido no input e divide em tokens classificados
function lexical(str) {
    const tokensPerLine = splitCode(str);
    const tokensPatterns = [];
    const errors = [];

    tokensPerLine.forEach(({ tokens, line }) => {
        for (let i = 0; i < tokens.length; i++) {
            const char = tokens[i];
            if (isNumber(char)) {
                tokensPatterns.push({ lexema: char, token: 'num', line });
                if (NumberHasMaxLength(char)) errors.push({ error: `"${char}" -> NUMERO PRECISA TER NO MÁXIMO 20 CARACTERES.`, line });
            }
            else if (isReserved(char)) tokensPatterns.push({ lexema: char, token: 'reserved', line });
            else if (isSimbol(char)) {
                let newChar = '';
                if (char === ':' && tokens[i + 1] === '=') {
                    newChar = ':=';
                    tokens.splice(i + 1, 1);
                }
                if (char === 'div') newChar = '/';
                tokensPatterns.push({ lexema: newChar || char, token: 'simbol', line });
            }
            else if (isComment(char)) {
                // tokensPatterns.push({ lexema: char, token: 'comment', line });
                if (!verifyCommentIsClosed(tokens)) errors.push({ error: `" ${char} " -> Comentário não foi fechado.`, line });
                const { index } = getComment(tokens, i);
                i = index;
            }
            else if (isIdentifier(char)) {
                tokensPatterns.push({ lexema: char, token: 'id', line });
                if (IdentifierHasMaxLength(char)) errors.push({ error: `" ${char} " -> IDENTIFICADOR PRECISA TER NO MÁXIMO 15 CARACTERES.`, line });
            }
            else if (char) errors.push({ error: `" ${char} " -> CARACTER INVÁLIDO.`, line });
        }
    })

    // Tokens classificados para ser usado no parser (sintatico)
    return { tokensPatterns, errors };
};


module.exports = lexical;
},{"../Rules/comments":5,"../Rules/reserved":6,"../Rules/simbols":7}],3:[function(require,module,exports){
const types = require('../Rules/types');
const { verifyDuplicateIds, verifyExpression, verifyUnusedVars } = require('./semantic');

/**
 * Função que verifica o bloco de declaração de variáveis
 * @param {Array<string>} tokens lista de tokens a serem analizados
 * @param {number} index posição atual do token apos a declaração da palavra reservada 'var'
 * @param {boolean} isProcedureBlock indicida se as variaveis entao sendo declaradas dentro do parametro de uma funçap
 * @returns lista de variáveis declarada, posição atual do token após análise, e erros se houver
 */
const verifyVars = (tokens, index, isProcedureBlock) => {
    let declaretedVars = [];
    let varsByType = {};
    let nextTokenIndex = index + 1;
    let nextToken = tokens[nextTokenIndex];
    if (nextToken.token !== 'id') return { error: `É esperado um identificador, porém um ${nextToken.token} "${nextToken.lexema}" foi recebido`, line: nextToken.line };
    declaretedVars.push(nextToken.lexema.toLowerCase());
    // Após o primeiro identificador, precisamos verificar as proximas regras
    nextTokenIndex = nextTokenIndex + 1;
    nextToken = tokens[nextTokenIndex];
    // Primeiro de declaração x, y, z: integer;
    if (nextToken.lexema === ',') {
        // O próximo precisa ser um identificador
        while (nextToken.lexema !== ':') {
            if (nextToken.lexema === ':') break;
            if (nextToken.lexema !== ',') return { error: `É esperado o simbolo ",", mas um ${nextToken.token} "${nextToken.lexema}" foi recebido`, line: nextToken.line };
            // Pula as virgurlas e verifica se é um id
            nextTokenIndex = nextTokenIndex + 1;
            nextToken = tokens[nextTokenIndex];
            if (nextToken.token !== 'id') return { error: `É esperado um identificador, mas um ${nextToken.token} "${nextToken.lexema}" foi recebido`, line: nextToken.line };
            declaretedVars.push(nextToken.lexema.toLowerCase());
            // Pula as virgurlas e verifica se é um id
            nextTokenIndex = nextTokenIndex + 1;
            nextToken = tokens[nextTokenIndex];
        }
    }
    // Segundo caso de declaração x : int;
    if (nextToken.lexema === ':') {
        while (nextToken.lexema !== ';' || tokens[nextTokenIndex + 1].token === 'id') {
            if (nextToken.lexema === ':') {
                // O próximo precisa ser um tipo definido em pascal (int, boolean, etc)
                nextTokenIndex = nextTokenIndex + 1;
                nextToken = tokens[nextTokenIndex];

                if (nextToken.token !== 'reserved') return { error: `É esperado uma declaração de tipo, porém um ${nextToken.token}: "${nextToken.lexema}" foi recebido`, line: nextToken.line };
                if (!types.includes(nextToken.lexema)) return { error: `É esperado um tipo definido do pascal, porém o tipo "${nextToken.lexema}" foi recebido`, line: nextToken.line };
                declaretedVars.forEach((newVar) => varsByType = { ...varsByType, [newVar]: nextToken.lexema });
                // Apos a definicao de tipo o proximo token precisa finalizar com um ';';
                nextTokenIndex = nextTokenIndex + 1;
                nextToken = tokens[nextTokenIndex];
                // o ")" é considerado para casos de variaveis dentro do parametro
                if (isProcedureBlock && nextToken.lexema === ')') return { declaretedVars, nextTokenIndex, varsByType };
                if (isProcedureBlock && (nextToken.lexema !== ')' && nextToken.lexema !== ';')) return { declaretedVars, nextTokenIndex: nextTokenIndex - 1, line: nextToken.line, varsByType };
                if (nextToken.lexema !== ';') return { error: `É esperado um ";" para finalizar a declaração, porém um "${nextToken.lexema}" foi recebido`, line: nextToken.line };
            }

            else if (tokens[nextTokenIndex + 1].token === 'id') {
                const currentVar = tokens[nextTokenIndex + 1].lexema.toLowerCase();
                declaretedVars.push(currentVar);

                // O próximo precisa ser o simbolo ':' para declarar o tipo
                nextTokenIndex = nextTokenIndex + 2;
                nextToken = tokens[nextTokenIndex];

                if (nextToken.lexema !== ":") return { error: `É esperado o simbolo ':', mas um ${nextToken.token} "${nextToken.lexema}" foi recebido`, line: nextToken.line };

                // O próximo precisa ser um tipo
                nextTokenIndex = nextTokenIndex + 1;
                nextToken = tokens[nextTokenIndex];

                if (nextToken.token !== 'reserved') return { error: `É esperado uma declaração de tipo, porém um ${nextToken.token}, mas "${nextToken.lexema}" foi recebido`, line: nextToken.line };
                if (!types.includes(nextToken.lexema)) return { error: `É esperado um tipo definido do pascal, porém o tipo "${nextToken.lexema}" foi recebido`, line: nextToken.line };
                varsByType = { ...varsByType, [currentVar]: nextToken.lexema };

                // Apos a definicao de tipo o proximo token precisa finalizar com um ';';
                nextTokenIndex = nextTokenIndex + 1;
                nextToken = tokens[nextTokenIndex];


                // o ")" é considerado para casos de variaveis dentro do parametro
                if (isProcedureBlock && nextToken.lexema === ')') return { declaretedVars, nextTokenIndex, varsByType };
                if (isProcedureBlock && (nextToken.lexema !== ')' && nextToken.lexema !== ';')) return { declaretedVars, nextTokenIndex: nextTokenIndex - 1, line: nextToken.line, varsByType };
                if (nextToken.lexema !== ';') return { error: `É esperado um ";" para finalizar a declaração, porém um "${nextToken.lexema}" foi recebido`, line: nextToken.line };
            }
        }
    }

    return { declaretedVars, nextTokenIndex, varsByType };
};

/**
 * Função que verifica o bloco da função reservada "write"
 * @param {Array<string>} tokens lista de tokens a serem analizados
 * @param {number} index posição atual do token apos a declaração da palavra reservada 'write'
 * @returns lista de erros e posição atual do token 
 */
const verifyWriteBlock = (tokens, index) => {
    let errors = [];
    let nextTokenIndex = index + 1;
    let nextToken = tokens[nextTokenIndex];

    // 1 caso -> writeln;
    if (nextToken.lexema === ';') return { errors, nextTokenIndex };
    // 2 caso -> write('');
    if (nextToken.lexema !== '(') errors.push({ error: `É esperado um "(" para chamar a função write, porém um "${nextToken.lexema}" foi recebido`, line: nextToken.line });

    while ((tokens.length !== nextTokenIndex)) {
        if (nextToken.lexema === ')') break;
        nextTokenIndex++;
        nextToken = tokens[nextTokenIndex];
    }

    if (nextToken.lexema === ')') {
        nextTokenIndex++;
        nextToken = tokens[nextTokenIndex];
        if (nextToken.lexema !== ';') errors.push({ error: `É esperado o simbolo ";", porém um "${nextToken.lexema}" foi recebido`, line: nextToken.line });
    } else errors.push({ error: `É esperado o simbolo ")" para encerrar a função write, porém um "${nextToken.lexema}" foi recebido`, line: nextToken.line });

    return { nextTokenIndex, errors };
};

/**
 * Função que verifica as regras bloco "Begin" 
 * @param {Array<string>} tokens lista de tokens a serem analizados
 * @param {number} index posição atual do token apos a declaração da palavra reservada 'begin'
 * @returns lista de erros e posição atual do token 
 */
const verifyBegin = (tokens, index) => {
    const beginPairs = [];
    const errors = [];

    const findBeginWithoutEnd = () => beginPairs.findIndex(({ end }) => (!end));
    const filterBeginWithoutEnd = () => beginPairs.filter(({ end }) => (!end));


    for (let i = index; i < tokens.length; i++) {
        if (tokens[i].lexema === 'begin') beginPairs.push({ begin: true, line: tokens[i].line });
        if (tokens[i].lexema === 'end') {
            const idx = findBeginWithoutEnd();
            const pair = beginPairs[idx];
            beginPairs[idx] = { ...pair, end: true };
        }
    }

    const beginsWithError = filterBeginWithoutEnd();
    beginsWithError?.forEach(({ line }) => {
        errors.push({ error: 'begin foi declarado porém não foi finalizado com end', line });
    });

    return { nextTokenIndex: index, errors };
};

/**
 * Função que verifica o bloco de um comentário e pula o texto inserido dentro dele para nao ser analisado
 * @param {Array<string>} tokens lista de tokens a serem analizados
 * @param {number} index posição atual do token apos a declaração do simbolo '{'
 * @returns posição atual do token 
 */
const verifyComment = (tokens, index) => {
    let nextTokenIndex = index + 1;
    let nextToken = tokens[nextTokenIndex];
    while (nextToken && nextToken.lexema !== '}') {
        nextTokenIndex++;
        nextToken = tokens[nextTokenIndex];
    }
    return { nextTokenIndex };
};

/**
 * Função que verifica o bloco da palavra reservada "procedure"
 * @param {Array<string>} tokens lista de tokens a serem analizados
 * @param {number} index posição atual do token apos a declaração da palavra reservada 'procedure'
 * @returns lista de erros, posição atual do token, procedure declaro e lista das variaveis declaradas nesse block
 */
const verifyProcedure = (tokens, index) => {
    const errors = [];
    // Guarda o identificador do procedure
    let declaredProcedure = null;
    // Guarda as variaveis no escopo do procedure
    let varsByScope = null;
   // Guarda os tipos variaveis no escopo do procedure
    let varsByTypeScope = null;
    let nextTokenIndex = index + 1;
    let nextToken = tokens[nextTokenIndex];

    // Após o reservado "procedure" é obrigatório um identificador
    if (nextToken.token !== 'id') errors.push({ error: `É esperado um identificador, porém um ${nextToken.token}: ${nextToken.lexema} foi recebido`, line: nextToken.line, });
    else declaredProcedure = nextToken.lexema.toLowerCase();
    nextTokenIndex++;
    nextToken = tokens[nextTokenIndex];

    // Cai no caso "(", se nao declarar nenhuma variavel dentro disso, pular a verificação de vars
    if (nextToken.lexema === '(') {
        if (tokens[nextTokenIndex + 1].token === 'id') {
            const { declaretedVars, nextTokenIndex: idx, error, line, varsByType } = verifyVars(tokens, nextTokenIndex, true);
            if (idx) nextTokenIndex = idx;
            if (error) errors.push({ error, line });
            varsByScope = { [declaredProcedure]: declaretedVars };
            varsByTypeScope = { [declaredProcedure]: varsByType };
        } else nextTokenIndex++;

        nextToken = tokens[nextTokenIndex];

        if (nextToken.lexema !== ')') {
            errors.push({ error: `É esperado o simbolo ")", porém foi recebido "${nextToken.token}: ${nextToken.lexema}"`, line: nextToken.line });
            nextTokenIndex--;
        }

        nextTokenIndex++;
        nextToken = tokens[nextTokenIndex];
    }

    if (nextToken.lexema !== ';') {
        errors.push({ error: `É esperado o simbolo ";", porém foi recebido "${nextToken.token}: ${nextToken.lexema}"`, line: nextToken.line });
        nextTokenIndex--;
    }

    nextTokenIndex++;
    nextToken = tokens[nextTokenIndex];

    // Após o ';' é iniciado um bloco de variaveis ou begin
    if (nextToken.lexema === 'var') {
        const { declaretedVars, nextTokenIndex: idx, error, line, varsByType } = verifyVars(tokens, nextTokenIndex);
        if (idx) nextTokenIndex = idx;
        if (error) errors.push({ error, line });
        varsByScope = { ...varsByScope, [declaredProcedure]: (varsByScope[declaredProcedure] || []).concat(declaretedVars || []) };        
        varsByTypeScope = { ...varsByTypeScope, [declaredProcedure]: { ...varsByTypeScope[declaredProcedure], ...varsByType} };

        nextTokenIndex++;
    }

    return { declaredProcedure, errors, varsByScope, nextTokenIndex, varsByTypeScope };

};


/**
 * Função que verifica as regras da palavra reservada "program"
 * @param {Array<string>} tokens lista de tokens a serem analizados
 * @param {number} index posição atual do token apos a declaração da palavra reservada 'program'
 * @returns lista de erros e posição atual do token;
 */
function verifyProgram(tokens, index) {
    const errors = [];
    let nextTokenIndex = index + 1;
    nextToken = tokens[nextTokenIndex];

    if (tokens[nextTokenIndex].token !== 'id') {
        errors.push({ error: `É esperado um identificador, porém um ${nextToken.token} foi recebido`, line: nextToken.line });
        nextTokenIndex = nextTokenIndex - 1;
    }
    nextTokenIndex++;
    if (tokens[nextTokenIndex].lexema !== ';') {
        errors.push({ error: `É esperado o simbolo ";", porém um ${nextToken.token} foi recebido`, line: nextToken.line });
        nextTokenIndex = nextTokenIndex - 1;
    }

    return { errors, nextTokenIndex };
}

/**
 * Função principa, itera por todos os tokens chamando as função auxiliares para verificar as regras
 * @param {Array<string>} tokens lista de tokens a serem analizados
 * @returns lista de erros apos compilaçao 
 */
function parser(tokens) {
    let errors = [];
    // Variáveis globais
    let declaredGlobalVariables = [];
    // Variáveis de escopo procedure
    let declaratedVarsByScope = {};
    // Procedures declaras
    let declaredProcedures = [];
    // Guarda o tipo de cada var global
    let declaredGlobalVarsByType = {};
    // Guarda o tipo de cada var por escopo
    let declaredScopeVarsByType = {};

    for (let i = 0; i < tokens.length; i++) {
        const { lexema, token, line } = tokens[i];
        switch (token) {
            case 'reserved':
                if (lexema === 'program') {
                    const { nextTokenIndex, errors: newErrors } = verifyProgram(tokens, i);
                    i = nextTokenIndex;
                    if (newErrors.length > 0) newErrors.forEach((err) => errors.push(err));
                    break;
                }
                if (lexema === 'var') {
                    const { declaretedVars: vars, nextTokenIndex, error, line, varsByType } = verifyVars(tokens, i);
                    i = nextTokenIndex;
                    if (vars) vars.forEach((newVar) => declaredGlobalVariables.push(newVar));
                    if (error) errors.push({ error, line });
                    const { error: newError, line: newLine } = verifyDuplicateIds(tokens, declaredGlobalVariables) || {};
                    if (newError) errors.push({ error: newError, line: newLine });
                    declaredGlobalVarsByType = { ...declaredGlobalVarsByType, ...varsByType };
                    const { errors: newErrors } = verifyUnusedVars(tokens, declaredGlobalVariables);
                    if (newErrors.length > 0) newErrors.forEach((err) => errors.push(err));
                    break;
                }
                if (lexema === 'write' || lexema === 'writeln') {
                    const { nextTokenIndex, errors: newErrors } = verifyWriteBlock(tokens, i);
                    i = nextTokenIndex;
                    if (newErrors.length > 0) newErrors.forEach((err) => errors.push(err));
                    break;
                }
                if (lexema === 'begin') {
                    const { nextTokenIndex, errors: newErrors } = verifyBegin(tokens, i);
                    i = nextTokenIndex;
                    if (newErrors.length > 0) newErrors.forEach((err) => errors.push(err));
                    let currentIndex = i;
                    let nextToken = tokens[currentIndex];
                    while (nextToken.lexema !== 'end' && currentIndex < tokens.length) {
                        if (nextToken.lexema === ':=') {
                            const { errors: newErr } = verifyExpression(tokens, currentIndex, declaredGlobalVarsByType);
                            if (newErr.length > 0) newErr.forEach((err) => errors.push(err));
                        }
                        currentIndex++;
                        nextToken = tokens[currentIndex];
                    }
                    break;
                }
                if (lexema === 'procedure') {
                    // Verifica e retorna as variaveis declarada nesse bloco
                    const { nextTokenIndex, errors: newErrors, declaredProcedure, varsByScope, varsByTypeScope } = verifyProcedure(tokens, i);
                    i = nextTokenIndex;
                    if (newErrors.length > 0) newErrors.forEach((err) => errors.push(err));
                    if (declaredProcedure) declaredProcedures.push(declaredProcedure);
                    if (varsByScope) declaratedVarsByScope = { ...declaratedVarsByScope, ...varsByScope };
                    if (varsByTypeScope) declaredScopeVarsByType = { ...declaredScopeVarsByType, ...varsByTypeScope };
                    // Verifica o bloco do procedure iniciado pelo begin
                    let nextToken = tokens[nextTokenIndex];
                    if (nextToken.lexema === 'begin') {
                        while (nextToken.lexema !== 'end') {
                            if (nextToken.token === 'id') {
                                const currVars = declaratedVarsByScope[declaredProcedure] || [];
                                const currLexema = nextToken.lexema.toLowerCase();
                                if (!currVars.includes(currLexema)) errors.push({ error: `identificador ${nextToken.lexema} não declarado nesse escopo`, line: nextToken.line });
                            }
                            if (nextToken.lexema === ':=') {
                                const { errors: newErr } = verifyExpression(tokens, i, declaredScopeVarsByType[declaredProcedure]);
                                if (newErr.length > 0) newErr.forEach((err) => errors.push(err));
                            }
                            i++;
                            nextToken = tokens[i];
                        }
                    }
                    const { error: newError, line: newLine } = verifyDuplicateIds(tokens, declaratedVarsByScope[declaredProcedure]) || {};
                    if (newError) errors.push({ error: newError, line: newLine });
                    break;
                }
                break;
            case 'id':
                const lexemaFormatted = lexema.toLowerCase();
                if (!declaredGlobalVariables.includes(lexemaFormatted) && !declaredProcedures.includes(lexemaFormatted)) errors.push({ error: `identificador ${lexema} não declarado`, line });
                break;
            case 'comment':
                if (lexema === '{') {
                    const { nextTokenIndex } = verifyComment(tokens, i);
                    i = nextTokenIndex;
                    break;
                }
                break;
        }
    }

    return errors;
}

module.exports = parser;

},{"../Rules/types":8,"./semantic":4}],4:[function(require,module,exports){
function verifyDuplicateIds(tokens, ids) {
    const duplicateId = ids.find((id, index) => ids.indexOf(id) !== index);
    if (duplicateId) {
        const { line, lexema } = tokens.find(({ lexema }) => lexema.toLowerCase() === duplicateId);
        return { error: `Identificador "${lexema}" declarado mais de uma vez`, line };
    }
    return duplicateId;
}


function verifyExpression(tokens, index, varsByType) {
    const errors = [];
    const prevIndex = index - 1;
    const prevToken = tokens[prevIndex];

    if (prevToken.token !== 'id') errors.push({ error: `É esperado um identificador antes de atribuir, porém "${prevToken.lexema}" for recebido`, line: prevToken.line });
    const prevTokenType = varsByType[prevToken.lexema.toLowerCase()];

    let nextTokenIndex = index + 1;
    let nextToken = tokens[nextTokenIndex];
    let nextTokenType = varsByType[nextToken?.lexema?.toLowerCase()];

    while (nextToken.lexema !== ';' && nextToken.token !== 'reserved') {
        if (nextToken.token !== 'simbol' && nextTokenType !== prevTokenType) errors.push({ error: `Variável ${nextToken.lexema} com o tipo ${nextTokenType} atribuido incorreto a variável "${prevToken.lexema}" do tipo ${prevTokenType}`, line: prevToken.line });
        nextTokenIndex++;
        nextToken = tokens[nextTokenIndex];
        if (nextToken?.token === 'id') nextTokenType = varsByType[nextToken?.lexema?.toLowerCase()];
    }

    if (nextToken.lexema !== ';') errors.push({ error: `É esperado um ';' para encerrar a expressão "${nextToken.lexema}" for recebido`, line: nextToken.line });

    return { errors };

}

function verifyUnusedVars(tokens, ids) {
    const errors = [];
    ids.forEach((id) => {
        const occurences = [];
        tokens.forEach(({ token, lexema }) => {
            if (token === 'id') {
                if (lexema.toLowerCase() === id) occurences.push(lexema);
            }
        });

     if (occurences.length === 1) {
        const { line, lexema } = tokens.find(({ lexema }) => lexema.toLowerCase() === id);
        errors.push({ error: `Variavél ${lexema} declarada, mas nunca utilizada`, line });
     }
    });

    return { errors };
}

module.exports = {
    verifyDuplicateIds,
    verifyExpression,
    verifyUnusedVars,
}
},{}],5:[function(require,module,exports){
module.exports = [
    '//', '{', '}'
];

},{}],6:[function(require,module,exports){
module.exports = [
    'program', 'procedure', 'var', 'int', 'boolean', 'read',
    'write', 'true', 'false', 'begin', 'end', 'if', 'then',
    'else', 'while', 'do', 'not', 'writeln', 'readln',
    'integer'
];

},{}],7:[function(require,module,exports){
module.exports = [
    '>', '<', '<>', '<=', '>=', ':=', '=', ';', ',', '(', ')', ':',
    '+',
    '-',
    '/',
    '*',
    '.',
    "'",
    "div",
    '"',
    '**',
];
},{}],8:[function(require,module,exports){
module.exports = [
    'byte',
    'shortint',
    'smallint',
    'word',
    'integer',
    'cardinal',
    'longint',
    'real',
    'boolean',
    'longword',
    'int64',
    'qword'
];
},{}],9:[function(require,module,exports){
const lexical = require('./Functions/lexical');
const parser = require('./Functions/parser');
const { readBlock } = require('./Functions/generatorCode');

function getInputValue(e) {
    return document.getElementById('text-edit').value || e;
}

function clearInput() {
    document.getElementById('text-edit').value = '';
}

function openModal() {
    // Abre o modal para mostrar o resultado
    const modal = document.getElementById('modal');
    modal.style.display = 'block';
}

function appendErrors(errors) {
    let errorsMessage = '';
    const errorsContainer = document.getElementById('errors');

    errors.forEach(({ error, line }) => errorsMessage = errorsMessage.concat(`Erro na linha ${line}: ${error}`, '\n'));
    if (errorsMessage === '') errorsContainer.innerHTML = 'Não há erros';
    else errorsContainer.innerHTML = errorsMessage;
}

function appendLexicalMessages(tokensPatterns) {
    let message = "";
    let paragraph = "";

    const concatMessage = (newMessage) => {
        message = message.concat(`${newMessage}`);
        paragraph = document.createElement('p');
        paragraph.innerHTML = message;
        document.getElementById('lexical').appendChild(paragraph);
        message = '';
        paragraph = '';
    }

    tokensPatterns.forEach(({ token, lexema, line }) => {
        concatMessage(lexema);
        concatMessage(token);
        concatMessage(line);
    });
}

// Pega o valor inserido no textArea, chama as função para retornar o resultado compilado
function getAnalysisResult(e) {
    if (e) e?.preventDefault();
    const str = getInputValue(e);
    const { tokensPatterns, errors: lexicalErrors } = lexical(str);
    const parserErrors = parser(tokensPatterns);
    const errors = lexicalErrors.concat(parserErrors);

    appendLexicalMessages(tokensPatterns);
    appendErrors(errors);
    openModal();
    if (errors.length === 0) readBlock(tokensPatterns);
    else document.getElementById('generate-code').style.display = 'none';
}

function clearProgram() {
    const allText = document.querySelectorAll('p');
    const allTextArr = [...allText];
    allTextArr.forEach((text) => text.remove());
    document.getElementById('text-input-user').value = '';
    document.getElementById('text-code').textContent = '';
}

// Recompila o programa
function executeAgain() {
    clearProgram();
    getAnalysisResult();
}


// Fecha o modal quando clica fora dele
window.onclick = function (event) {
    const modal = document.getElementById('modal');

    if (event.target === modal) {
        modal.style.display = "none";
        clearProgram();
    }
}

// Invoka as funções de limpar e compilar
document.getElementById('clear').addEventListener('click', clearInput);
document.querySelector('form').addEventListener('submit', getAnalysisResult);
document.getElementById('execute').addEventListener('click', executeAgain);


// Adicionar numerador no editor
const textarea = document.getElementById('text-edit');
const lineNumbers = document.querySelector('.line-numbers');

textarea.addEventListener('keyup', event => {
    const numberOfLines = event.target.value.split('\n').length

    lineNumbers.innerHTML = Array(numberOfLines)
        .fill('<span></span>')
        .join('')
})
},{"./Functions/generatorCode":1,"./Functions/lexical":2,"./Functions/parser":3}]},{},[9]);
