# Chic & Fit — site da loja

Site da loja de roupas fitness Chic & Fit: vitrine de produtos, carrinho de
compras e checkout. Construído com Next.js (App Router) + Tailwind CSS.

## Rodando o projeto

```bash
npm install
npm run dev
```

Depois acesse http://localhost:3000

## Painel administrativo

Acesse **`/admin`** no site (ex: `https://seu-site.vercel.app/admin`) para
gerenciar as peças sem mexer em código: adicionar peça nova, subir fotos,
editar categoria/preço/descrição/cores e excluir. É protegido por senha
(variável `ADMIN_PASSWORD`) e não aparece em nenhum menu público.

As peças e as fotos enviadas pelo painel ficam salvas no **Vercel Blob**
(`src/lib/products.ts` só serve como catálogo inicial, usado até a primeira
gravação feita pelo painel). Para o painel funcionar em produção, veja
"Variáveis de ambiente necessárias" abaixo.

Fotos aceitas: JPG, PNG ou WEBP, até 4MB. Fotos `.HEIC` do iPhone precisam
ser convertidas antes (ao compartilhar a foto pelo iPhone, escolha a opção
"Mais compatível").

## Variáveis de ambiente necessárias

Configure em **Vercel → seu projeto → Settings → Environment Variables**
(e em `.env.local` para rodar localmente):

| Variável | Para que serve |
| --- | --- |
| `ADMIN_PASSWORD` | Senha de login do painel `/admin` |
| `ADMIN_SESSION_SECRET` | Chave aleatória usada para assinar o cookie de sessão do admin (qualquer string longa e aleatória) |
| `BLOB_READ_WRITE_TOKEN` | Gerado automaticamente pela Vercel ao criar um Blob Store (Storage → Create Database → Blob) e conectá-lo ao projeto |

Sem o `BLOB_READ_WRITE_TOKEN`, o site público continua funcionando
normalmente (mostra o catálogo inicial), mas o painel não consegue salvar
peças novas nem fotos — ele mostra um aviso claro pedindo para configurar
essa variável.

## Peças "Em breve"

Peças sem preço/descrição definidos ainda (`isDraft: true`) aparecem na
loja com a etiqueta "Em breve" e um botão para perguntar no WhatsApp em vez
de comprar. Preencha o preço e a descrição pelo painel `/admin` para a peça
passar a vender normalmente.

## Como funciona a venda hoje

O checkout coleta os dados do cliente e do endereço, cria o pedido via
`/api/pedidos` e leva o cliente para uma página de confirmação com um botão
**"Enviar pedido pelo WhatsApp"** já com o resumo do pedido preenchido —
assim a loja recebe o pedido e combina pagamento/frete diretamente. Isso já
permite vender pelo site hoje, sem gateway de pagamento configurado.

Como ainda não há banco de dados, o pedido usado na página de confirmação
vem do próprio navegador do cliente (`sessionStorage`, gerado no momento da
compra) — funciona em qualquer hospedagem, inclusive serverless (Vercel).
`createOrder` (`src/lib/orders.ts`) também tenta gravar em `data/orders.json`
como registro extra, mas isso só persiste rodando localmente; não é a fonte
usada para mostrar a confirmação.

## Integrando pagamento online (próximo passo)

Ainda não há Stripe/Mercado Pago conectado. Quando quiser ativar pagamento
por cartão/Pix direto no site:

1. Criar conta no gateway escolhido (Stripe ou Mercado Pago) e pegar as chaves de API.
2. Em `src/app/api/pedidos/route.ts`, no lugar do comentário `NOTE:`, criar a
   cobrança/checkout session do gateway com os itens do pedido.
3. Redirecionar o cliente para a página de pagamento do gateway em vez da
   página de confirmação atual (ou usar webhooks do gateway para atualizar
   `status` do pedido).
4. Trocar `createOrder`/`getOrder` (`src/lib/orders.ts`) por um banco de
   dados de verdade antes de depender de histórico de pedidos no servidor —
   hoje o registro em `data/orders.json` é só um extra local, não confiável
   em produção.

## Observações técnicas

- O projeto vive em `C:\Users\Usuario\Documents\chic-fit` (fora da pasta
  `Chic&Fit`) porque o caractere `&` no caminho quebra o instalador de
  scripts do npm no Windows. O nome da marca no site continua "Chic & Fit"
  normalmente — isso afeta só o nome da pasta no computador.
