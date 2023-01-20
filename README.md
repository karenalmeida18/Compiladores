# TRABALHO FINAL DE COMPILADORES
### Gabriela Sinastre, Karen Almeida, Maykon Borges

## Como rodar
Como usar a aplicação: 
  - Abrir o arquivo index.html no seu navegador;
  - Inserir o código no editor da interface (na pasta "Tests" tem alguns códigos de exemplos);
  - Clicar em "compilar" para receber o resultado das análises.
  - Para fechar o resultado da compilação, clicar fora do modal que foi aberto com o resultado.
  - Para limpar o código e inserir um novo de forma rápida, clicar em "Limpar".

## Detalhes de implemetação
A aplicação foi desenvolvida usando JavaScript puro (sem auxilio de biblioteca ou gerador), com duas funções principais nos arquivos:
  - *lexical.js*: função responsável por fazer a análise léxica, recebe o texto inputado, corta em lexemas e classifica em tokens, tratando os espaços em brancos. Por meio de funções auxiliares faz a classificação, como: identificar se é número, letra, identificador, símbolo, palavra reservada, etc. O retorna da função é uma lista de tokens e uma lista de erros (se houver).
  - *parser.js*: função responsável por fazer a análise sintática, recebe os tokens classificados e itera por eles verificando se cada token está seguindo uma ordem lógica. O retorna da função é uma lista de erros, vazia caso não haja nenhum erro durante compilação, ou objetos com o erro indicado e a linha que ocorreu o erro.
  
A interface do projeto foi construída em html e css puros, com uma interface de editor para receber o código e devolver o resultado da análise para o usuário. Ao inserir o código na interface do editor, a função principal em "index.js" é chamada:
  - *getAnalysisResult*: recebe o evento (texto do código), chama a função de análise léxica e organiza na interface o resultado da parte léxica. Guarda os tokens retornados e envia como parâmetro pra função parser, que retorna o resultado da análise sintática e a partir disso formata os erros pra mostrar na tela.

## Imagens da aplicação
### Tela inicial para inserir o código
![image](https://user-images.githubusercontent.com/49257649/213568150-bf90713b-ead9-455d-9f05-a6d15f0faad8.png)
### Resultado da compilação sem erros
![image](https://user-images.githubusercontent.com/49257649/213568264-81d88200-ae3a-4f50-bcbb-409814e87495.png)
### Resultado da compilação com erro léxico
![image](https://user-images.githubusercontent.com/49257649/213568359-2502fa38-2c71-4e95-941c-7852c25e61de.png)
### Resultado da compilação com erro sintático
![image](https://user-images.githubusercontent.com/49257649/213567939-616f1810-f0ee-4014-a357-b2f94bf9c25f.png)
