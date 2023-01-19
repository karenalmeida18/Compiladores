(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

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
        let currentTokens = line.split(/(\s+|[+, -, /, *, **, (, ), <, >, <>, <=, =>, :=, =, ;, ,, //, {, }, :, ., ', "])/);
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
            else if (isSimbol(char)) tokensPatterns.push({ lexema: char, token: 'simbol', line });
            else if (isComment(char)) {
                tokensPatterns.push({ lexema: char, token: 'comment', line });
                if (!verifyCommentIsClosed(tokens)) errors.push({ error: `" ${char} " -> Comentário não foi fechado.`, line });
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
},{"../Rules/comments":3,"../Rules/reserved":4,"../Rules/simbols":5}],2:[function(require,module,exports){
const types = require('../Rules/types');

const verifyVars = (tokens, index) => {
    let declaretedVars = [];
    let nextTokenIndex = index + 1;
    let nextToken = tokens[nextTokenIndex];

    if (nextToken.token !== 'id') return { error: `É esperado um identificador, porém um ${nextToken.token} "${nextToken.lexema}" foi recebido`, line: nextToken.line };
    declaretedVars.push(nextToken.lexema);

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
            declaretedVars.push(nextToken.lexema);
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

                if (nextToken.token !== 'reserved') return { error: `É esperado uma declaração de tipo, porém um ${nextToken.token}, mas "${nextToken.lexema}" foi recebido`, line: nextToken.line };
                if (!types.includes(nextToken.lexema)) return { error: `É esperado um tipo definido do pascal, porém o tipo "${nextToken.lexema}" foi recebido`, line: nextToken.line };
                // Apos a definicao de tipo o proximo token precisa finalizar com um ';';
                nextTokenIndex = nextTokenIndex + 1;
                nextToken = tokens[nextTokenIndex];


                if (nextToken.lexema !== ';') return { error: `É esperado um ";" para finalizar a declaração, porém um "${nextToken.lexema}" foi recebido`, line: nextToken.line };
            }

            else if (tokens[nextTokenIndex + 1].token === 'id') {
                declaretedVars.push(tokens[nextTokenIndex + 1].lexema);

                // O próximo precisa ser o simbolo ':' para declarar o tipo
                nextTokenIndex = nextTokenIndex + 2;
                nextToken = tokens[nextTokenIndex];

                if (nextToken.lexema !== ":") return { error: `É esperado o simbolo ':', mas um ${nextToken.token} "${nextToken.lexema}" foi recebido`, line: nextToken.line };

                // O próximo precisa ser um tipo
                nextTokenIndex = nextTokenIndex + 1;
                nextToken = tokens[nextTokenIndex];

                if (nextToken.token !== 'reserved') return { error: `É esperado uma declaração de tipo, porém um ${nextToken.token}, mas "${nextToken.lexema}" foi recebido`, line: nextToken.line };
                if (!types.includes(nextToken.lexema)) return { error: `É esperado um tipo definido do pascal, porém o tipo "${nextToken.lexema}" foi recebido`, line: nextToken.line };

                // Apos a definicao de tipo o proximo token precisa finalizar com um ';';
                nextTokenIndex = nextTokenIndex + 1;
                nextToken = tokens[nextTokenIndex];


                if (nextToken.lexema !== ';') return { error: `É esperado um ";" para finalizar a declaração, porém um "${nextToken.lexema}" foi recebido`, line: nextToken.line };
            }
        }
    }

    return { declaretedVars, nextTokenIndex };
};

const verifyWriteBlock = (tokens, index) => {
    let errors = [];
    let nextTokenIndex = index + 1;
    let nextToken = tokens[nextTokenIndex];
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

const verifyComment = (tokens, index) => {
    let nextTokenIndex = index + 1;
    let nextToken = tokens[nextTokenIndex];
    while (nextToken && nextToken.lexema !== '}') {
        nextTokenIndex++;
        nextToken = tokens[nextTokenIndex];
    }
    return { nextTokenIndex };
};


function parser(tokens) {
    let errors = [];
    let declaredVariables = [];

    for (let i = 0; i < tokens.length; i++) {
        const { lexema, token, line } = tokens[i];
        switch (token) {
            case 'reserved':
                if (lexema === 'program') {
                    i++;
                    if (tokens[i].token !== 'id') {
                        errors.push({ error: `É esperado um identificador, porém um ${token} foi recebido`, line });
                        i = i - 1;
                    }
                    i++;
                    if (tokens[i].lexema !== ';') {
                        errors.push({ error: `É esperado o simbolo ";", porém um ${token} foi recebido`, line });
                        i = i - 1;
                    }
                    break;
                }
                if (lexema === 'var') {
                    const { declaretedVars: vars, nextTokenIndex, error, line } = verifyVars(tokens, i);
                    i = nextTokenIndex;
                    if (vars) declaredVariables = [...vars];
                    if (error) errors.push({ error, line });
                    break;
                }
                if (lexema === 'write' || lexema === 'writeln') {
                    const { nextTokenIndex, errors: newErrors } = verifyWriteBlock(tokens, i);
                    i = nextTokenIndex;
                    if (newErrors.length > 0) errors = [...errors, newErrors];
                    break;
                }
                if (lexema === 'begin') {
                    const { nextTokenIndex, errors: newErrors } = verifyBegin(tokens, i);
                    i = nextTokenIndex;
                    if (newErrors.length > 0) errors = [...errors, newErrors];
                    break;
                }
                break;
            case 'id':
                if (!declaredVariables.includes(lexema)) errors.push({ error: `identificador ${lexema} não declarado`, line });
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

},{"../Rules/types":6}],3:[function(require,module,exports){
module.exports = [
    '//', '{', '}'
];

},{}],4:[function(require,module,exports){
module.exports = [
    'program', 'procedure', 'var', 'int', 'boolean', 'read',
    'write', 'true', 'false', 'begin', 'end', 'if', 'then',
    'else', 'while', 'do', 'div', 'not', 'writeln', 'readln',
    'integer'
];

},{}],5:[function(require,module,exports){
module.exports = [
    '>', '<', '<>', '<=', '>=', ':=', '=', ';', ',', '(', ')', ':',
    '+',
    '-',
    '/',
    '*',
    '.',
    "'",
    '"',
    '**',
];
},{}],6:[function(require,module,exports){
module.exports = [
    'byte',
    'shortint',
    'smallint',
    'word',
    'integer',
    'cardinal',
    'longint',
    'longword',
    'int64',
    'qword'
];
},{}],7:[function(require,module,exports){
const lexical = require('./Functions/lexical');
const parser = require('./Functions/parser');

function getInputValue(e) {
    return document.querySelector('textarea').value || e;
}

function clearInput() {
    document.querySelector('textarea').value = '';
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

    appendLexicalMessages(tokensPatterns);
    appendErrors(lexicalErrors.concat(parserErrors));
    openModal();
}


// Fecha o modal quando clica fora dele
window.onclick = function (event) {
    const modal = document.getElementById('modal');

    if (event.target === modal) {
        modal.style.display = "none";
        const allText = document.querySelectorAll('p');
        const allTextArr = [...allText];
        allTextArr.forEach((text) => text.remove());
    }
}

// Invoka as funções de limpar e compilar
document.getElementById('clear').addEventListener('click', clearInput);
document.querySelector('form').addEventListener('submit', getAnalysisResult);


// Adicionar numerador no editor
const textarea = document.querySelector('textarea');
const lineNumbers = document.querySelector('.line-numbers');

textarea.addEventListener('keyup', event => {
    const numberOfLines = event.target.value.split('\n').length

    lineNumbers.innerHTML = Array(numberOfLines)
        .fill('<span></span>')
        .join('')
})
},{"./Functions/lexical":1,"./Functions/parser":2}]},{},[7]);
