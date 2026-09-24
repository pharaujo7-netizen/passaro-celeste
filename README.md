# Pássaro Celeste

Aplicativo web instalável do Clube de Desbravadores Pássaro Celeste (IASD Jardim Brasil).

## Produção

- Site: https://passaro-celeste-clube.pharaujo7.chatgpt.site
- Publicação: Sites, com banco D1 e arquivos R2.
- Código: a fonte publicada é versionada pelo Sites; o repositório GitHub é um espelho a manter sincronizado.

## Acesso

O criador entra pelo botão "Acesso do criador com ChatGPT" usando o e-mail autorizado. A direção pré-cadastra cada pessoa e entrega individualmente o código de ativação, válido por 48 horas. O código também permite redefinir a senha de quem já foi ativado. O responsável é cadastrado antes do menor, e fica vinculado a ele. Dados pessoais e evidências exigem autenticação.

## Materiais da DSA

Os cartões de classes regulares e agrupadas apontam para as páginas oficiais da DSA. A fonte pública dos cartões é de 2017 e deve ser lida junto às OMD posteriores, inclusive a atualização de livros de 2024. O Manual de Especialidades com nova edição de agosto de 2025 é apresentado pela Editora SobreTudo. Seus requisitos completos ainda não foram importados; o cadastro manual exige conferência contra essa edição e não deve ser apresentado como transcrição oficial. Os registros internos de conclusão não substituem cada requisito dos cartões.

## Desenvolvimento

Use `node /root/.codex/plugins/cache/openai-curated-remote/sites/0.1.71/scripts/configure-execution-profile.mjs` ao abrir um checkout no runtime Sites, depois instale dependências e execute o build. Migrações do banco são geradas a partir de `db/schema.ts` pelo Drizzle e aplicadas na publicação. Não inclua dados de pessoas ou códigos de ativação no Git.
