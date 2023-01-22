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