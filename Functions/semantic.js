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

    while (nextToken.lexema !== ';' && nextTokenIndex < tokens.length) {
        if (nextToken.token !== 'simbol' && nextTokenType !== prevTokenType) errors.push({ error: `Tipo ${nextTokenType} atribuido incorreto a variavel "${prevToken.lexema}" do tipo ${prevTokenType}`, line: prevToken.line });
        nextTokenIndex++;
        nextToken = tokens[nextTokenIndex];
        if (nextToken.token === 'id') nextTokenType = varsByType[nextToken?.lexema?.toLowerCase()];
    }

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