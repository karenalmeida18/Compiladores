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
